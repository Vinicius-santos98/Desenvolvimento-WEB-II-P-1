import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Situations } from './situations';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // select: false -> a senha não é carregada nas consultas (find, findOne...) nem
  // devolvida pela API; quem precisar dela (ex.: login) pede explicitamente
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  // chave (token) para recuperar a senha: nula até o usuário pedir a recuperação.
  // select: false -> assim como a senha, nunca é devolvida pela API (quem tivesse
  // essa chave poderia trocar a senha do usuário)
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, select: false })
  recoverPassword!: string | null;

  @Column()
  situationId!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Muitos usuários para uma situação
  @ManyToOne(() => Situations, (situation) => situation.users)
  @JoinColumn({ name: 'situationId' })
  situation!: Situations;

  // Compara a senha digitada (texto puro) com o hash salvo no banco.
  // Retorna true se forem a mesma senha. Atenção: o usuário precisa ter sido
  // buscado com a senha (select: { password: true }), senão this.password é undefined.
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
