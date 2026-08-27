import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Situations } from './situations';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated!: Date;

  // Muitos usuários para uma situação
  @ManyToOne(() => Situations, (situation) => situation.users)
  @JoinColumn({ name: 'situation_id' })
  situation!: Situations;
}
