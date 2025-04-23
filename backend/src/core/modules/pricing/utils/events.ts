import {
  CommonEvents,
  moduleEventBuilderFactory,
  Modules,
  PricingEvents,
} from "@medusajs/framework/utils"

export const eventBuilders = {
  createdPriceSet: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.CREATED,
    object: "price_set",
    eventName: PricingEvents.PRICE_SET_CREATED,
  }),
  createdPrice: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.CREATED,
    object: "price",
    eventName: PricingEvents.PRICE_CREATED,
  }),
  createdPriceRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.CREATED,
    object: "price_rule",
    eventName: PricingEvents.PRICE_RULE_CREATED,
  }),
  createdPriceList: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.CREATED,
    object: "price_list",
    eventName: PricingEvents.PRICE_LIST_CREATED,
  }),
  createdPriceListRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.CREATED,
    object: "price_list_rule",
    eventName: PricingEvents.PRICE_LIST_RULE_CREATED,
  }),
  updatedPriceSet: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.UPDATED,
    object: "price_set",
    eventName: PricingEvents.PRICE_SET_UPDATED,
  }),
  updatedPrice: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.UPDATED,
    object: "price",
    eventName: PricingEvents.PRICE_UPDATED,
  }),
  updatedPriceList: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.UPDATED,
    object: "price_list",
    eventName: PricingEvents.PRICE_LIST_UPDATED,
  }),
  updatedPriceListRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.UPDATED,
    object: "price_list_rule",
    eventName: PricingEvents.PRICE_LIST_RULE_UPDATED,
  }),
  updatedPriceRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.UPDATED,
    object: "price_rule",
    eventName: PricingEvents.PRICE_RULE_UPDATED,
  }),
  deletedPriceSet: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.DELETED,
    object: "price_set",
    eventName: PricingEvents.PRICE_SET_DELETED,
  }),
  deletedPrice: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.DELETED,
    object: "price",
    eventName: PricingEvents.PRICE_DELETED,
  }),
  deletedPriceList: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.DELETED,
    object: "price_list",
    eventName: PricingEvents.PRICE_LIST_DELETED,
  }),
  deletedPriceListRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.DELETED,
    object: "price_list_rule",
    eventName: PricingEvents.PRICE_LIST_RULE_DELETED,
  }),
  deletedPriceRule: moduleEventBuilderFactory({
    source: Modules.PRICING,
    action: CommonEvents.DELETED,
    object: "price_rule",
    eventName: PricingEvents.PRICE_RULE_DELETED,
  }),
}
