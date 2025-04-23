import { ConfirmVariantInventoryWorkflowInputDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { prepareConfirmInventoryInput } from "../prepare-confirm-inventory-input"

describe("prepareConfirmInventoryInput", () => {
  it("should use the quantity from the itemsToUpdate", () => {
    const input: ConfirmVariantInventoryWorkflowInputDTO = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 3,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
      ],
      itemsToUpdate: [
        {
          variant_id: "pv_1",
          quantity: 2,
        },
      ],
    }

    const output = prepareConfirmInventoryInput({ input })

    expect(output).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 3,
          quantity: 2, // overrides the quantity from the items array
          allow_backorder: false,
          location_ids: ["sl_1"],
        },
      ],
    })
  })

  it("should only return variants with manage_inventory set to true", () => {
    const input: ConfirmVariantInventoryWorkflowInputDTO = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: "pv_2",
          manage_inventory: false,
          inventory_items: [
            {
              inventory_item_id: "ii_2",
              variant_id: "pv_2",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
        {
          variant_id: "pv_2",
          quantity: 1,
          id: "item_2",
        },
      ],
    }

    const output = prepareConfirmInventoryInput({ input })

    expect(output).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 1,
          quantity: 1,
          allow_backorder: false,
          location_ids: ["sl_1"],
        },
      ],
    })
  })

  it("should return all inventory items for a variant", () => {
    const input: ConfirmVariantInventoryWorkflowInputDTO = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
            {
              inventory_item_id: "ii_2",
              variant_id: "pv_1",
              required_quantity: 2,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
      ],
    }

    const output = prepareConfirmInventoryInput({ input })

    expect(output).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 1,
          quantity: 1,
          allow_backorder: false,
          location_ids: ["sl_1"],
        },
        {
          id: "item_1",
          inventory_item_id: "ii_2",
          required_quantity: 2,
          quantity: 1,
          allow_backorder: false,
          location_ids: ["sl_1"],
        },
      ],
    })
  })

  it("should throw an error if any variant has no stock locations linked to the sales channel", () => {
    const input = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: "pv_2",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_2",
              variant_id: "pv_2",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_2",
                        sales_channels: [{ id: "sc_2" }], // Different sales channel
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
        {
          variant_id: "pv_2",
          quantity: 1,
          id: "item_2",
        },
      ],
    }

    expect(() => prepareConfirmInventoryInput({ input })).toThrow(MedusaError)
  })

  it("if allow_backorder is true, it should return normally even if there's no stock location for the sales channel", () => {
    const input = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          allow_backorder: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_2",
                        sales_channels: [{ id: "sc_2" }], // Different sales channel
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
      ],
    }

    const result = prepareConfirmInventoryInput({ input })

    expect(result).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 1,
          quantity: 1,
          allow_backorder: true,
          location_ids: [], // TODO: what should this be?
        },
      ],
    })
  })

  it("should return only stock locations with availability, if any", () => {
    const input = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stocked_quantity: 10, // 10 - 9 = 1 < 2: no availability
                    reserved_quantity: 9,
                    location_id: "sl_1",
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
                {
                  location_levels: {
                    stocked_quantity: 7, // 7 - 5 = 2 >= 2: availability
                    reserved_quantity: 5,
                    location_id: "sl_2",
                    stock_locations: [
                      {
                        id: "sl_2",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 2,
          id: "item_1",
        },
      ],
    }

    const result = prepareConfirmInventoryInput({ input })

    expect(result).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 1,
          quantity: 2,
          allow_backorder: false,
          location_ids: ["sl_2"], // Only includes location with available stock
        },
      ],
    })
  })

  it("should return all locations if none has availability", () => {
    const input = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 1,
              inventory: [
                {
                  location_levels: {
                    stocked_quantity: 1,
                    reserved_quantity: 1, // 1 - 1 = 0 < 2: no availability
                    location_id: "sl_1",
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
                {
                  location_levels: {
                    stocked_quantity: 4,
                    reserved_quantity: 3, // 4 - 3 = 1 < 2: no availability
                    location_id: "sl_2",
                    stock_locations: [
                      {
                        id: "sl_2",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 2,
          id: "item_1",
        },
      ],
    }

    const result = prepareConfirmInventoryInput({ input })

    expect(result).toEqual({
      items: [
        {
          id: "item_1",
          inventory_item_id: "ii_1",
          required_quantity: 1,
          quantity: 2,
          allow_backorder: false,
          location_ids: ["sl_1", "sl_2"], // Includes all locations since none has availability
        },
      ],
    })
  })

  it("should throw an error if any variant has no inventory items", () => {
    const input = {
      sales_channel_id: "sc_1",
      variants: [
        {
          id: "pv_1",
          manage_inventory: true,
          inventory_items: [
            {
              inventory_item_id: "ii_1",
              variant_id: "pv_1",
              required_quantity: 3,
              inventory: [
                {
                  location_levels: {
                    stock_locations: [
                      {
                        id: "sl_1",
                        sales_channels: [{ id: "sc_1" }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: "pv_2",
          manage_inventory: true,
          inventory_items: [], // No inventory items
        },
      ],
      items: [
        {
          variant_id: "pv_1",
          quantity: 1,
          id: "item_1",
        },
        {
          variant_id: "pv_2",
          quantity: 1,
          id: "item_2",
        },
      ],
    }

    expect(() => prepareConfirmInventoryInput({ input })).toThrow(MedusaError)
  })
})
