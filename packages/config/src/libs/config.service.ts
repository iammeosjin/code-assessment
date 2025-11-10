import { Global, Inject, Injectable, Optional } from '@nestjs/common';
import { Tokens } from './tokens';
import { ConfigModuleOptions } from './types';

export class MissingConfigError extends Error {
  constructor(key: string) {
    super(`missing config: key=${key}`);
  }
}

@Global()
@Injectable()
export class ConfigService {
  constructor(
    @Optional()
    @Inject(Tokens.ConfigOptions)
    private options: ConfigModuleOptions,
  ) {}
  private get(key: string): string {
    const value = this.options?.data?.[key] || process.env[key];

    if (value === undefined) {
      throw new MissingConfigError(key);
    }

    return value;
  }

  public getString(
    key: string,
    opts?: {
      optional?: true;
    },
  ): string {
    try {
      return this.get(key);
    } catch (err) {
      if (opts?.optional && err instanceof MissingConfigError) {
        return;
      }

      throw err;
    }
  }

  public getNumber(
    key: string,
    opts?: {
      optional?: true;
    },
  ): number {
    try {
      return Number(this.get(key));
    } catch (err) {
      if (opts?.optional && err instanceof MissingConfigError) {
        return;
      }

      throw err;
    }
  }

  public getBoolean(key: string): boolean {
    try {
      const value = this.get(key);

      return Boolean(value);
    } catch (err) {
      if (err instanceof MissingConfigError) {
        return false;
      }

      throw err;
    }
  }
}
