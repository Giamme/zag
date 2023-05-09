import { createAnatomy } from "@zag-js/anatomy"

export const anatomy = createAnatomy("radio-group").parts(
  "root",
  "label",
  "radio",
  "radioLabel",
  "radioControl",
  "radioInput",
  "indicator",
)
export const parts = anatomy.build()
