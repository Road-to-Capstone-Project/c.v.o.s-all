import {
  BigNumberInput,
  ComputeActionItemLine,
  PromotionTypes,
} from "@medusajs/framework/types"
import {
  ApplicationMethodTargetType,
  ComputedActions,
  MathBN,
  MedusaError,
  PromotionType,
} from "@medusajs/framework/utils"
import { areRulesValidForContext } from "../validations"
import { computeActionForBudgetExceeded } from "./usage"

export type EligibleItem = {
  item_id: string
  quantity: BigNumberInput
}

function sortByPrice(a: ComputeActionItemLine, b: ComputeActionItemLine) {
  return MathBN.lt(a.subtotal, b.subtotal) ? 1 : -1
}

/*
  Grabs all the items in the context where the rules apply
  We then sort by price to prioritize most valuable item
*/
function filterItemsByPromotionRules(
  itemsContext: ComputeActionItemLine[],
  rules?: PromotionTypes.PromotionRuleDTO[]
) {
  return itemsContext
    .filter((item) =>
      areRulesValidForContext(
        rules || [],
        item,
        ApplicationMethodTargetType.ITEMS
      )
    )
    .sort(sortByPrice)
}

export function getComputedActionsForBuyGet(
  promotion: PromotionTypes.PromotionDTO,
  itemsContext: ComputeActionItemLine[],
  methodIdPromoValueMap: Map<string, BigNumberInput>,
  eligibleBuyItemMap: Map<string, EligibleItem[]>,
  eligibleTargetItemMap: Map<string, EligibleItem[]>
): PromotionTypes.ComputeActions[] {
  const computedActions: PromotionTypes.ComputeActions[] = []

  if (!itemsContext) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `"items" should be present as an array in the context to compute actions`
    )
  }

  if (!itemsContext?.length) {
    return computedActions
  }

  const minimumBuyQuantity = MathBN.convert(
    promotion.application_method?.buy_rules_min_quantity ?? 0
  )

  const itemsMap = new Map<string, ComputeActionItemLine>(
    itemsContext.map((i) => [i.id, i])
  )

  if (
    MathBN.lte(minimumBuyQuantity, 0) ||
    !promotion.application_method?.buy_rules?.length
  ) {
    return computedActions
  }

  const eligibleBuyItems = filterItemsByPromotionRules(
    itemsContext,
    promotion.application_method?.buy_rules
  )

  if (!eligibleBuyItems.length) {
    return computedActions
  }

  const eligibleBuyItemQuantity = MathBN.sum(
    ...eligibleBuyItems.map((item) => item.quantity)
  )

  /*
    Get the total quantity of items where buy rules apply. If the total sum of eligible items
    does not match up to the minimum buy quantity set on the promotion, return early.
  */
  if (MathBN.gt(minimumBuyQuantity, eligibleBuyItemQuantity)) {
    return computedActions
  }

  const eligibleItemsByPromotion: EligibleItem[] = []
  let accumulatedQuantity = MathBN.convert(0)

  /*
    Eligibility of a BuyGet promotion can span across line items. Once an item has been chosen
    as eligible, we can't use this item or its partial remaining quantity when we apply the promotion on
    the target item.

    We build the map here to use when we apply promotions on the target items.
  */

  for (const eligibleBuyItem of eligibleBuyItems) {
    if (MathBN.gte(accumulatedQuantity, minimumBuyQuantity)) {
      break
    }

    const reservableQuantity = MathBN.min(
      eligibleBuyItem.quantity,
      MathBN.sub(minimumBuyQuantity, accumulatedQuantity)
    )

    if (MathBN.lte(reservableQuantity, 0)) {
      continue
    }

    eligibleItemsByPromotion.push({
      item_id: eligibleBuyItem.id,
      quantity: MathBN.min(
        eligibleBuyItem.quantity,
        reservableQuantity
      ).toNumber(),
    })

    accumulatedQuantity = MathBN.add(accumulatedQuantity, reservableQuantity)
  }

  // Store the eligible buy items for this promotion code in the map
  eligibleBuyItemMap.set(promotion.code!, eligibleItemsByPromotion)

  // If we couldn't accumulate enough items to meet the minimum buy quantity, return early
  if (MathBN.lt(accumulatedQuantity, minimumBuyQuantity)) {
    return computedActions
  }

  // Get the number of target items that should receive the discount
  const targetQuantity = MathBN.convert(
    promotion.application_method?.apply_to_quantity ?? 0
  )

  // If no target quantity is specified, return early
  if (MathBN.lte(targetQuantity, 0)) {
    return computedActions
  }

  // Find all items that match the target rules criteria
  const eligibleTargetItems = filterItemsByPromotionRules(
    itemsContext,
    promotion.application_method?.target_rules
  )

  // If no items match the target rules, return early
  if (!eligibleTargetItems.length) {
    return computedActions
  }

  // Track quantities of items that can't be used as targets because they were used in buy rules
  const inapplicableQuantityMap = new Map<string, BigNumberInput>()

  // Build map of quantities that are ineligible as targets because they were used to satisfy buy rules
  for (const buyItem of eligibleItemsByPromotion) {
    const currentValue =
      inapplicableQuantityMap.get(buyItem.item_id) || MathBN.convert(0)
    inapplicableQuantityMap.set(
      buyItem.item_id,
      MathBN.add(currentValue, buyItem.quantity)
    )
  }

  // Track items eligible for receiving the discount and total quantity that can be discounted
  const targetItemsByPromotion: EligibleItem[] = []
  let targetableQuantity = MathBN.convert(0)

  // Find items eligible for discount, excluding quantities used in buy rules
  for (const eligibleTargetItem of eligibleTargetItems) {
    // Calculate how much of this item's quantity can receive the discount
    const inapplicableQuantity =
      inapplicableQuantityMap.get(eligibleTargetItem.id) || MathBN.convert(0)
    const applicableQuantity = MathBN.sub(
      eligibleTargetItem.quantity,
      inapplicableQuantity
    )

    if (MathBN.lte(applicableQuantity, 0)) {
      continue
    }

    // Calculate how many more items we need to fulfill target quantity
    const remainingNeeded = MathBN.sub(targetQuantity, targetableQuantity)
    const fulfillableQuantity = MathBN.min(remainingNeeded, applicableQuantity)

    if (MathBN.lte(fulfillableQuantity, 0)) {
      continue
    }

    // Add this item to eligible targets
    targetItemsByPromotion.push({
      item_id: eligibleTargetItem.id,
      quantity: fulfillableQuantity.toNumber(),
    })

    targetableQuantity = MathBN.add(targetableQuantity, fulfillableQuantity)

    // If we've found enough items to fulfill target quantity, stop looking
    if (MathBN.gte(targetableQuantity, targetQuantity)) {
      break
    }
  }

  // Store eligible target items for this promotion
  eligibleTargetItemMap.set(promotion.code!, targetItemsByPromotion)

  // If we couldn't find enough eligible target items, return early
  if (MathBN.lt(targetableQuantity, targetQuantity)) {
    return computedActions
  }

  // Track remaining quantity to apply discount to and get discount percentage
  let remainingQtyToApply = MathBN.convert(targetQuantity)
  const applicablePercentage = promotion.application_method?.value ?? 100

  // Apply discounts to eligible target items
  for (const targetItem of targetItemsByPromotion) {
    if (MathBN.lte(remainingQtyToApply, 0)) {
      break
    }

    const item = itemsMap.get(targetItem.item_id)!
    const appliedPromoValue =
      methodIdPromoValueMap.get(item.id) ?? MathBN.convert(0)
    const multiplier = MathBN.min(targetItem.quantity, remainingQtyToApply)

    // Calculate discount amount based on item price and applicable percentage
    const pricePerUnit = MathBN.div(item.subtotal, item.quantity)
    const applicableAmount = MathBN.mult(pricePerUnit, multiplier)
    const amount = MathBN.mult(applicableAmount, applicablePercentage).div(100)

    if (MathBN.lte(amount, 0)) {
      continue
    }

    remainingQtyToApply = MathBN.sub(remainingQtyToApply, multiplier)

    // Check if applying this discount would exceed promotion budget
    const budgetExceededAction = computeActionForBudgetExceeded(
      promotion,
      amount
    )

    if (budgetExceededAction) {
      computedActions.push(budgetExceededAction)
      continue
    }

    // Track total promotional value applied to this item
    methodIdPromoValueMap.set(
      item.id,
      MathBN.add(appliedPromoValue, amount).toNumber()
    )

    // Add computed discount action
    computedActions.push({
      action: ComputedActions.ADD_ITEM_ADJUSTMENT,
      item_id: item.id,
      amount,
      code: promotion.code!,
    })
  }

  return computedActions
}

export function sortByBuyGetType(a, b) {
  if (a.type === PromotionType.BUYGET && b.type !== PromotionType.BUYGET) {
    return -1 // BuyGet promotions come first
  } else if (
    a.type !== PromotionType.BUYGET &&
    b.type === PromotionType.BUYGET
  ) {
    return 1 // BuyGet promotions come first
  } else if (a.type === b.type) {
    // If types are equal, sort by application_method.value in descending order when types are equal
    if (a.application_method.value < b.application_method.value) {
      return 1 // Higher value comes first
    } else if (a.application_method.value > b.application_method.value) {
      return -1 // Lower value comes later
    }

    /*
      If the promotion is a BuyGet & the value is the same, we need to sort by the following criteria:
      - buy_rules_min_quantity in descending order
      - apply_to_quantity in descending order
    */
    if (a.type === PromotionType.BUYGET) {
      if (
        a.application_method.buy_rules_min_quantity <
        b.application_method.buy_rules_min_quantity
      ) {
        return 1
      } else if (
        a.application_method.buy_rules_min_quantity >
        b.application_method.buy_rules_min_quantity
      ) {
        return -1
      }

      if (
        a.application_method.apply_to_quantity <
        b.application_method.apply_to_quantity
      ) {
        return 1
      } else if (
        a.application_method.apply_to_quantity >
        b.application_method.apply_to_quantity
      ) {
        return -1
      }
    }

    return 0 // If all criteria are equal, keep original order
  } else {
    return 0 // If types are different (and not BuyGet), keep original order
  }
}
