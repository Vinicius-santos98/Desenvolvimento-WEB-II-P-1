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
