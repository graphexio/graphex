import { Model, Table, Column, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'post',
  timestamps: false,
})
export default class Post extends Model<Post> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  body: string;

  @Column({
    type: DataType.INTEGER,
    references: {
      model: 'user',
      key: 'id',
    },
    onDelete: 'CASCADE',
  })
  owner_id: number;

  @Column({
    field: 'created_at',
    allowNull: true,
    type: DataType.DATE,
  })
  createdAt?: Date;

  @Column({
    field: 'updated_at',
    allowNull: true,
    type: DataType.DATE,
  })
  updatedAt?: Date;

  // @Column({
  //   field: 'deleted_at',
  //   allowNull: true,
  //   type: DataType.DATE,
  // })
  // deletedAt?: Date;
}
