import { FindOptionsOrder, ObjectLiteral, Repository } from 'typeorm';

// Resultado genérico da paginação
export interface PaginationResult<T> {
  error: boolean;
  data: T[];
  currentPage: number;
  lastPage: number;
  totalRecords: number;
}

export class PaginationService {
  // Método estático para paginar qualquer repositório
  public static async paginate<T extends ObjectLiteral>(
    repository: Repository<T>,
    page: number = 1,
    limit: number = 10,
    order: FindOptionsOrder<T> = {},
  ): Promise<PaginationResult<T>> {
    // conta o total de registros no banco de dados
    const totalRecords = await repository.count();

    // calcula o número da última página
    const lastPage = Math.ceil(totalRecords / limit);

    // verifica se a página solicitada é válida
    if (page > lastPage && lastPage > 0) {
      throw new Error(`Página inválida. O total de páginas é ${lastPage}`);
    }

    // calcula a partir de qual registro começa a busca
    const offset = (page - 1) * limit;

    // busca os registros já paginados
    const data = await repository.find({
      take: limit,
      skip: offset,
      order,
    });

    return {
      error: false,
      data,
      currentPage: page,
      lastPage,
      totalRecords,
    };
  }
}
