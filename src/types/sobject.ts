export type ID = string;

export type AttributeInfo = {
  type: string;
  url: string;
};

export interface SObject {
  Id: ID;
  Name?: string;
  attributes: AttributeInfo;
}

export interface QueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
}

export interface SObjectBasedAPICallResult<T> {
  status: number;
  result: T;
}
