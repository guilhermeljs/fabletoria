import { nanoid } from 'nanoid'

export type EntityId = string

export function newId(): EntityId {
  return nanoid(21)
}
