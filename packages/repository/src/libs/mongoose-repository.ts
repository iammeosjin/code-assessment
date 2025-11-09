/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ObjectId } from '@boomering/object-id';
import { Decimal } from 'decimal.js';
import { Binary } from 'mongodb';
import {
  Connection as DBConnection,
  IndexDefinition,
  IndexOptions,
  Model,
  Schema,
  SchemaDefinition,
  Types,
} from 'mongoose';
import R from 'ramda';
import { DuplicateKeyError, WriteConflictError } from './errors';
import { Filter, Repository } from './repository';

export type RawItem = { _id: Buffer; [key: string]: unknown };

const FILTER_CONDITION_MAP = new Map([
  ['equal', '$eq'],
  ['notEqual', '$ne'],
  ['in', '$in'],
  ['notIn', '$nin'],
  ['greaterThan', '$gt'],
  ['greaterThanOrEqual', '$gte'],
  ['lesserThan', '$lt'],
  ['lesserThanOrEqual', '$lte'],
]);

const FILTER_CONDITION_MAP_KEYS = [...FILTER_CONDITION_MAP.keys()];

function normalizeFilterField(field: any): any {
  if (field === undefined) {
    return undefined;
  }

  if (
    field === null ||
    ['number', 'string', 'boolean'].includes(typeof field) ||
    field instanceof Date ||
    field instanceof Buffer
  ) {
    return field;
  }

  if (field instanceof ObjectId) {
    return field.buffer;
  }

  if (field instanceof Array) {
    return R.map(normalizeFilterField, field);
  }

  if (field instanceof Decimal) {
    return new Types.Decimal128(field.toString());
  }

  throw new Error(`unsupported filter field type: ${field}`);
}

function serializeFilterField(field: any): any {
  try {
    return normalizeFilterField(field);
  } catch (err) {
    if (Array.isArray(field)) {
      return field.map((elem) => {
        if (elem && typeof elem === 'object' && !Array.isArray(elem)) {
          return serializeFilter(elem);
        }
        return serializeFilterField(elem);
      });
    }

    if (field instanceof Object || Object.getPrototypeOf(field) === null) {
      const keys = R.intersection(
        R.keys(field),
        FILTER_CONDITION_MAP_KEYS,
      ) as string[];

      const result: Record<string, any> = {};

      for (const key of keys) {
        const condition = FILTER_CONDITION_MAP.get(key);
        if (condition) {
          result[condition] = serializeFilterField(field[key]);
        }
      }

      return result;
    }

    throw err;
  }
}

export function serializeFilter(filter: any): any {
  const data: Record<string, unknown> = R.omit(['id', 'or'], filter);

  if (filter.id) {
    data['_id'] = filter.id;
  }

  if (filter.or) {
    data['$or'] = Array.isArray(filter.or) ? filter.or : [filter.or];
  }

  return R.map(serializeFilterField, data);
}

export function flattenObject(item: any, parentKey?: string): Partial<RawItem> {
  return R.compose(
    R.reduce((accum, [key, value]: [string, unknown]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof Array) &&
        !(value instanceof ObjectId) &&
        !(value instanceof Decimal) &&
        !(value instanceof Date) &&
        !(value instanceof Buffer)
      ) {
        return R.mergeRight(accum, flattenObject(value, newKey));
      }

      return {
        ...accum,
        [newKey]: value,
      };
    }, {}),
    R.toPairs,
  )(item) as never;
}

function serializeArray(arr: any[]): any[] {
  return R.map(
    (item) =>
      item instanceof ObjectId
        ? item.buffer
        : Array.isArray(item)
          ? serializeArray(item)
          : typeof item === 'object' && item !== null
            ? serializeItem(item)
            : item,
    arr,
  );
}

export function serializeItem(
  item: Record<string, unknown> & { id: ObjectId },
): Partial<RawItem> {
  const data: Record<string, unknown> = {};
  const __t: Record<string, number> = {};

  if (item.id) {
    data['_id'] = item.id.buffer;
    __t['__t._id'] = 0;
  }

  for (const [key, value] of R.toPairs(R.omit(['id'], item))) {
    data[key] = value;

    if (value instanceof ObjectId) {
      data[key] = value.buffer;
      __t[`__t.${key}`] = 0;
    }

    if (value instanceof Decimal) {
      data[key] = new Types.Decimal128(value.toString());
      __t[`__t.${key}`] = 1;
    }

    if (Array.isArray(value)) {
      data[key] = serializeArray(value);
    }
  }

  return { ...data, ...__t };
}

function deserializeArray(arr: any[]): any[] {
  return R.map(
    (item) =>
      item instanceof Binary
        ? ObjectId.from(item.buffer as Buffer)
        : Array.isArray(item)
          ? deserializeArray(item)
          : typeof item === 'object' && item !== null
            ? deserializeItem(item)
            : item,
    arr,
  );
}

export function deserializeItem(item: any) {
  if (item === null) {
    return null;
  }

  if (!item['__t']) {
    const _item = item;

    item['__t'] = R.pipe(
      R.toPairs,
      R.filter(([key, _]) => {
        if (key.startsWith('__t.')) {
          delete item[key];
          return true;
        }

        return false;
      }),
      R.reduce(
        (acc, [key, value]) =>
          R.assocPath((key as string).slice(4).split('.'), value, acc),
        {},
      ),
    )(_item);
  }

  const normalizeBuffer = (obj: Record<string, unknown>) => {
    return R.compose(
      R.fromPairs,
      R.filter(R.complement(R.isNil)) as never,
      R.map(([key, value]): unknown => {
        if (value === undefined) {
          return null;
        }

        if (value instanceof Types.Decimal128) {
          return [key, new Decimal(value.toString())];
        }

        if (value instanceof Binary) {
          return [key, value.buffer];
        }

        if (Array.isArray(value)) {
          return [key, deserializeArray(value)];
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          !(
            value instanceof Array ||
            value instanceof Buffer ||
            value instanceof ObjectId ||
            value instanceof Decimal ||
            value instanceof Date
          )
        ) {
          return [key, normalizeBuffer(value)];
        }

        return [key, value];
      }) as never,
      R.toPairs,
    )(obj || {});
  };

  const raw = R.compose(
    normalizeBuffer,
    R.reduce(
      (accum, [key, value]) => {
        const serialized = R.path(key.split('.'), item);

        let deserialized;

        if (value === 0 && R.complement(R.isNil)(serialized)) {
          deserialized = ObjectId.from(
            Buffer.from(
              <any>serialized instanceof Binary
                ? (<Binary>serialized).buffer
                : serialized,
            ),
          );
        }

        if (value === 1 && R.complement(R.isNil)(serialized)) {
          deserialized = new Decimal(
            (serialized as Types.Decimal128).toString(),
          );
        }

        return R.set(R.lensPath(key.split('.')), deserialized, accum);
      },
      R.omit(['__v', '__t'], item.toObject ? item.toObject() : item),
    ),
    R.toPairs,
    flattenObject,
  )(item['__t']) as Record<string, unknown>;

  return {
    ...R.omit(['_id'], raw),
    id: R.prop('_id', raw),
  };
}

export class MongooseRepository<
  TEntity extends { id: ObjectId } = { id: ObjectId },
> implements Repository<TEntity>
{
  private readonly _model: Model<RawItem>;

  constructor(
    connection: DBConnection,
    name: string,
    definition: SchemaDefinition,
    indexes?: [IndexDefinition, IndexOptions?][],
  ) {
    const schema = new Schema(
      {
        ...definition,
        __t: Schema.Types.Mixed,
      },
      {
        versionKey: false,
        strict: true,
      },
    );

    for (const [indexDefinition, indexOptions] of indexes || []) {
      schema.index(indexDefinition, indexOptions);
    }

    this._model = connection.model<RawItem>(name, schema);
  }

  public get model() {
    return this._model;
  }

  public async create(data: TEntity | Array<TEntity>): Promise<void> {
    console.log('create', data);
    let serializedItems: Partial<RawItem>[];
    if (Array.isArray(data)) {
      serializedItems = data.map((item) =>
        serializeItem(<never>flattenObject(item)),
      );
    } else {
      serializedItems = [serializeItem(<never>flattenObject(data))];
    }
    console.log('serializedItems', serializedItems);
    try {
      if (serializedItems.length > 1) {
        await this.model.insertMany(serializedItems);
      } else {
        await this.model.create(serializedItems);
      }
    } catch (err: any) {
      if (err.code === 11000 && err.constructor.name === 'MongoServerError') {
        throw new DuplicateKeyError(err.keyValue);
      }

      if (err.code === 112) {
        throw new WriteConflictError(err.message);
      }

      throw err;
    }
  }

  public async update(
    filter: ObjectId | Filter<TEntity>,
    data: Partial<Omit<TEntity, 'id'>>,
  ): Promise<void> {
    const serialized = serializeItem(<never>flattenObject(data));

    try {
      if (filter instanceof ObjectId) {
        await this.model.updateOne(
          { _id: filter.buffer },
          {
            $set: serialized,
          },
        );

        return;
      }

      await this.model.updateMany(serializeFilter(filter), {
        $set: serialized,
      });
    } catch (error: any) {
      if (error.code === 28 && error.constructor.name === 'MongoServerError') {
        const match = error.message.match(/{.*}/);
        const unset = {};

        if (match) {
          Object.assign(
            unset,
            JSON.parse(
              match
                ?.at(0)
                ?.replace(/([a-zA-Z0-9_]+):/g, '"$1":')
                ?.replace(/: null/g, ': ""')
                ?.replace(/'/g, '"'),
            ),
          );
        }

        if (!R.isEmpty(unset)) {
          if (filter instanceof ObjectId) {
            await this.model.updateOne(
              { _id: filter.buffer },
              {
                $unset: unset,
              },
            );

            await this.model.updateOne(
              { _id: filter.buffer },
              {
                $set: serialized,
              },
            );

            return;
          }

          await this.model.updateMany(serializeFilter(filter), {
            $unset: unset,
          });

          await this.model.updateMany(serializeFilter(filter), {
            $set: serialized,
          });

          return;
        }
      }

      throw error;
    }
  }

  public async delete(filter: ObjectId | Filter<TEntity>): Promise<void> {
    if (filter instanceof ObjectId) {
      await this.model.deleteOne({ _id: new Binary(filter.buffer) });

      return;
    }

    await this.model.deleteMany(serializeFilter(filter));
  }

  public async findOne(
    filter: ObjectId | Filter<TEntity>,
  ): Promise<TEntity | null> {
    const options = {};

    const serializedFilter = serializeFilter(
      filter instanceof ObjectId ? { id: filter } : filter,
    );

    const doc = await this.model.findOne(serializedFilter, null, options);

    if (!doc) {
      return null;
    }

    return deserializeItem(doc) as TEntity;
  }

  public async find(filter: ObjectId | Filter<TEntity>): Promise<TEntity[]> {
    const options = {};

    const serializedFilter = serializeFilter(
      filter instanceof ObjectId ? { id: filter } : filter,
    );

    const docs = await this.model.find(serializedFilter, null, options);

    return deserializeArray(docs) as TEntity[];
  }
}
