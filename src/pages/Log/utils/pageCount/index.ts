import { PAGE_SIZE } from '../../../../game/records'

export const pageCountOf = (total: number, pageSize: number): number => {
  return Math.max(1, Math.ceil(total / (pageSize || PAGE_SIZE)))
}
