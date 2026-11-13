import slugify from 'slugify';

/**
 * Gera o slug (versão do texto própria para URL) a partir de um nome.
 * Ex.: "Café Pilão 500g" -> "cafe-pilao-500g"
 *
 * Usado pelo controller e pelo seed de produtos, para que os dois sigam
 * exatamente a mesma regra (senão a checagem de slug duplicado falharia).
 */
export function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true });
}
