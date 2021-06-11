type Selector = Record<any, any>;
type DataRecord = Record<any, any>;

export interface DataSourceAdapter {
  findOne(params: {
    collectionName: string;
    selector: Selector;
    fields: string[];
  }): Promise<DataRecord>;
  findMany(params: {
    collectionName: string;
    selector: Selector;
    fields: string[];
    skip?: number;
    limit?: number;
    sort?: any;
  }): Promise<DataRecord[]>;
  insertOne(params: {
    collectionName: string;
    doc: DataRecord;
  }): Promise<DataRecord>;
  insertMany(params: {
    collectionName: string;
    docs: DataRecord[];
  }): Promise<DataRecord[]>;
  updateOne(params: {
    collectionName: string;
    selector: Selector;
    doc: DataRecord;
    arrayFilters: any;
  }): Promise<DataRecord>;
  deleteOne(params: {
    collectionName: string;
    selector: Selector;
  }): Promise<DataRecord>;
  deleteMany(params: {
    collectionName: string;
    selector: Selector;
  }): Promise<number>;
  aggregate(params: {
    collectionName: string;
    selector?: Selector;
  }): Promise<[{ count: number }]>;
}
