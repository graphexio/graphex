import { Model, Table, Column, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'user',
  timestamps: false,
})
export default class User extends Model<User> {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
  })
  id!: string;

  @Column({
    allowNull: true,
    type: DataType.STRING,
  })
  username?: string;

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

  @Column({
    field: 'deleted_at',
    allowNull: true,
    type: DataType.DATE,
  })
  deletedAt?: Date;
}
