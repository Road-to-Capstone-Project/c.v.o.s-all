export const defaults = [
  "id",
  "value",
  "created_at",
  "updated_at",
  "metadata",
  "*products",
]

export const retrieveProductTagConfig = {
  defaults,
  isList: false,
}

export const listProductTagConfig = {
  defaults,
  defaultLimit: 50,
  isList: true,
}
