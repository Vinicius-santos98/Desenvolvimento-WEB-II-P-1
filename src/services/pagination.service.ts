import { FindOptionsOrder, ObjectLiteral, Repository } from 'typeorm';

// Erro de paginação (página inexistente): é erro do cliente, não falha do servidor
export class PaginationError extends Error {}

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
    // normaliza os valores recebidos (evita página/limite negativo, zero ou absurdo)
    const currentPage = Math.max(1, Math.floor(Number(page) || 1));
    const perPage = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)));

    // conta o total de registros no banco de dados
    const totalRecords = await repository.count();

    // calcula o número da última página
    const lastPage = Math.ceil(totalRecords / perPage);

    // verifica se a página solicitada é válida
    if (currentPage > lastPage && lastPage > 0) {
      throw new PaginationError(`Página inválida. O total de páginas é ${lastPage}`);
    }

    // calcula a partir de qual registro começa a busca
    const offset = (currentPage - 1) * perPage;

    // busca os registros já paginados
    const data = await repository.find({
      take: perPage,
      skip: offset,
      order,
    });

    return {
      error: false,
      data,
      currentPage,
      lastPage,
      totalRecords,
    };
  }
}
