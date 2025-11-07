import { ObjectId } from '@boomering/object-id';

export type FilterCondition<T> = {
  equal?: T;
  notEqual?: T;
  in?: T[];
  notIn?: T[];
  greaterThan?: T;
  greaterThanOrEqual?: T;
  lesserThan?: T;
  lesserThanOrEqual?: T;
};

export type Filter<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? U | FilterCondition<U>
    : T[P] | FilterCondition<T[P]>;
} & Record<string, unknown>;

export interface Repository<T extends { id: ObjectId }> {
  create(data: T | Array<T>): Promise<void>;
  update(
    filter: ObjectId | Filter<T>,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void>;
  delete(filter: ObjectId | Filter<T>): Promise<void>;
  find(filter: ObjectId | Filter<T>): Promise<T | null>;
}
