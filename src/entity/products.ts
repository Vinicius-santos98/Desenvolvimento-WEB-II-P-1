import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductCategories } from './product-categories';
import { ProductSituations } from './product-situations';

@Entity('products')
export class Products {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // gerado automaticamente a partir do nome, ex.: "Notebook Dell" -> "notebook-dell"
  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  // o PostgreSQL devolve decimal como texto ("4299.90"); o transformer converte para
  // número, para a API responder price: 4299.9 em vez de uma string
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column()
  productSituationId!: number;

  @Column()
  productCategoryId!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Muitos produtos para uma situação de produto
  @ManyToOne(() => ProductSituations, (productSituation) => productSituation.products)
  @JoinColumn({ name: 'productSituationId' })
  productSituation!: ProductSituations;

  // Muitos produtos para uma categoria
  @ManyToOne(() => ProductCategories, (productCategory) => productCategory.products)
  @JoinColumn({ name: 'productCategoryId' })
  productCategory!: ProductCategories;
}
