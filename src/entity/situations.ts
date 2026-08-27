import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Users } from './users';

@Entity('situations')
export class Situations {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name_situation!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated!: Date;

  // Uma situação para muitos usuários
  @OneToMany(() => Users, (users) => users.situation)
  users!: Users[];
}
