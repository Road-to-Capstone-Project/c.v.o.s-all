import { Badge, Select, Text, toast } from "@medusajs/ui"
import { Rating } from '@smastrom/react-rating'
import { HttpTypes } from "@medusajs/types"
import { ModuleReview } from "@starter/types"
import { getFirstChars } from "@lib/util/get-first-chars"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useActionState, useState } from "react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { createReview } from "@lib/data/reviews"

export default function ProductReviews({
    product,
    reviews
}: {
    product: HttpTypes.StoreProduct
    reviews: ModuleReview[] | undefined
}) {
    const [message, formAction] = useActionState(createReview, null)
    const [rating, setRating] = useState(0);
    const [errorMessage, setErrorMessage] = useState(message);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        formData.append("rating", rating.toString())
        formData.append("product_id", product.id)
        if (formData.get("variant_sku") === "none") {
            setErrorMessage("Please select a variant")
            return
        }
        if (rating === 0) {
            setErrorMessage("Please select a rating")
            return
        }
        // alert(JSON.stringify(Object.fromEntries(formData.entries())))
        setIsReadOnly(true)
        await formAction(formData)
        // alert(message)
        if (message) {
            setErrorMessage(message)
        } else {
            setErrorMessage(null)
            setRating(0)
            toast.success("Review posted successfully!")
        }
        setIsReadOnly(false)

    }

    return (
        <div className="w-full bg-neutral-100 rounded-lg border p-2 my-4">

            <form action={handleSubmit}>
                <div className="flex flex-col">
                    {reviews?.length === 0 ? <Text key="no-reviews-yet" className="text-center text-gray-500">No reviews yet. Let's be the 1st one.</Text>
                        :
                        reviews?.map((review) => {
                            return (
                                <div key={review.id} className="border rounded-md p-3 ml-3 my-3 bg-slate-50">
                                    <div className="flex gap-3 items-center">

                                        <img src={`https://placehold.co/600x400?text=${getFirstChars(review.customer_name)}`}
                                            className="object-cover w-8 h-8 rounded-full border-2 border-emerald-400  shadow-emerald-400" />
                                        <div className="flex flex-col">
                                            <h3 className="font-bold">
                                                {review.customer_name}
                                            </h3>
                                            <h4 className="font-medium text-sm text-gray-500">
                                                {review.created_at === review.updated_at ? `Created at ${new Date(review.created_at).toLocaleString()}` : `Latest modified at ${new Date(review.updated_at).toLocaleDateString()}`}
                                            </h4>
                                        </div>
                                    </div>
                                    <Badge size="2xsmall" rounded="full" color="red" className="mr-1">
                                        {review.variant_sku}
                                    </Badge>
                                    <Rating style={{ maxWidth: 100, marginTop: '0.5rem' }} value={review.rating} readOnly />
                                    <p className="text-gray-900 text-xl mt-2">
                                        {review.title}
                                    </p>

                                    <p className="text-gray-600 mt-2">
                                        {review.content}
                                    </p>

                                </div>
                            )
                        })
                    }

                </div>
                <div className="w-full px-3 my-2">
                    <div className="w-full flex flex-row gap-2 my-2">
                        <Text className="text-lg font-bold mt-1">Variant: </Text>
                        <Select
                            name="variant_sku"
                            defaultValue="none"
                            required
                            data-testid="product-variant-input"
                        >
                            <Select.Trigger className="rounded-full w-[25%] h-10 px-4">
                                <Select.Value placeholder="Select a product variant" />
                            </Select.Trigger>
                            <Select.Content>
                                {product?.variants?.map((variant) => (
                                    <Select.Item key={variant.id} value={variant.sku as string}>
                                        {variant.sku}
                                    </Select.Item>
                                ))
                                }
                                <Select.Item key={"none"} value={"none"}>
                                    None
                                </Select.Item>
                            </Select.Content>
                        </Select>
                        <Text className="text-lg font-bold mt-1">Rating: </Text>
                        <Rating isRequired style={{ maxWidth: 100, }} invisibleLabel="Rate your buy" invisibleItemLabels={['1 star', '2 stars', '3 stars', '4 stars', '5 stars']} readOnly={isReadOnly}
                            value={rating}
                            onChange={setRating}
                            visibleLabelId="rating"
                        />
                    </div>
                    <textarea
                        className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-10 py-2 px-3 font-medium placeholder-gray-700 focus:outline-none focus:bg-white overflow-hidden"
                        name="title" placeholder='Share us your quick thought! (100 chars only)' maxLength={103} required></textarea>
                    <textarea
                        className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-20 py-2 px-3 font-medium placeholder-gray-700 focus:outline-none focus:bg-white"
                        name="content" placeholder='Anything else?' required></textarea>
                    <ErrorMessage error={errorMessage} data-testid="register-error" />

                </div>

                <div className="w-full flex justify-end px-3">
                    <SubmitButton
                        className="w-fit"
                        data-testid="submit-review-button"
                    >
                        Post Review
                    </SubmitButton>
                </div>
            </form>


        </div>
    )
}
