import React, { useEffect, useState } from "react";

import {
  render,
  Divider,
  Image,
  Icon,
  Pressable,
  Banner,
  Heading,
  Select,
  Button,
  InlineLayout,
  BlockStack,
  Text,
  SkeletonText,
  SkeletonImage,
  useCartLines,
  useApplyCartLinesChange,
  useExtensionApi,
} from "@shopify/checkout-ui-extensions-react";

// Set up the entry point for the extension
render("Checkout::Dynamic::Render", () => <App />);

// The function that will render the app
function App() {
  // Use `query` for fetching product data from the Storefront API, and use `i18n` to format
  // currencies, numbers, and translate strings
  const { query, i18n } = useExtensionApi();
  // Get a reference to the function that will apply changes to the cart lines from the imported hook
  const applyCartLinesChange = useApplyCartLinesChange();
  // Set up the states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantImage, setVariantImage] = useState("");
  const [variantTitle, setVariantTitle] = useState("");
  const [descriptionState, setDescriptionState] = useState("hidden");

  // On initial load, fetch the product variants
  useEffect(() => {
    // Set the loading state to show some UI if you're waiting
    setLoading(true);
    // Use `query` api method to send graphql queries to the Storefront API
    query(
      `query ($handle: String!) {
        collectionByHandle(handle: $handle) {
          products(first: 10) {
            nodes {
              id
              title
              description
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 10) {
                nodes {
                  value:id
                  label:title
                  price {
                    amount
                  }
  
                  image {
                    id
                    originalSrc
                  }
                }
              }
            }
          }
        }  
      }`,
      {
        variables: { handle: "Merchandise" },
      }
    )
      .then(({ data }) => {
        // Set the `products` array so that you can reference the array items

        setProducts(data.collectionByHandle.products.nodes);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  // If an offer is added and an error occurs, then show some error feedback using a banner
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  // Access the current cart lines and subscribe to changes
  const lines = useCartLines();

  // Show a loading UI if you're waiting for product variant data
  // Use Skeleton components to keep placement from shifting when content loads
  if (loading) {
    return (
      <BlockStack spacing="loose">
        <Divider />
        <Heading level={2}>You might also like</Heading>
        <BlockStack spacing="loose">
          <InlineLayout
            spacing="base"
            columns={[64, "fill", "auto"]}
            blockAlignment="center"
          >
            <SkeletonImage aspectRatio={1} />
            <BlockStack spacing="none">
              <SkeletonText inlineSize="large" />
              <SkeletonText inlineSize="small" />
            </BlockStack>
            <Button kind="secondary" disabled={true}>
              Add
            </Button>
          </InlineLayout>
        </BlockStack>
      </BlockStack>
    );
  }
  // If product variants can't be loaded, then show nothing
  if (!loading && products.length === 0) {
    return null;
  }

  // Get the IDs of all product variants in the cart
  const cartLineProductVariantIds = lines.map((item) => item.merchandise.id);
  // Filter out any products on offer that are already in the cart
  const productsOnOffer = products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ value }) =>
      cartLineProductVariantIds.includes(value)
    );
    return !isProductVariantInCart;
  });

  // If all of the products are in the cart, then don't show the offer
  if (!productsOnOffer.length) {
    return null;
  }

  // Choose the first available product variant on offer
  const { images, title, variants, description } = productsOnOffer[0];

  // Localize the currency for international merchants and customers
  const renderPrice = i18n.formatCurrency(variants.nodes[0].price.amount);

  // Use the first product image or a placeholder if the product has no images
  const imageUrl =
    variants.nodes[0].image.originalSrc ??
    images.nodes[0]?.url ??
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081";

  if (variants.nodes.length > 1) {
    return (
      <BlockStack spacing="loose">
        <Divider />
        <Heading level={2}>You might also like</Heading>
        <BlockStack spacing="loose">
          <InlineLayout
            spacing="base"
            // Use the `columns` property to set the width of the columns
            // Image: column should be 64px wide
            // BlockStack: column, which contains the title and price, should "fill" all available space
            // Button: column should "auto" size based on the intrinsic width of the elements
            columns={[64, "fill", "auto"]}
            blockAlignment="center"
          >
            <Image
              border="base"
              borderWidth="base"
              borderRadius="loose"
              source={variantImage || imageUrl}
              description={title}
              aspectRatio={1}
            />
            <BlockStack spacing="none">
              <Text size="medium" emphasis="bold">
                {title}
              </Text>

              <Text size="medium" emphasis="subdued">
                {variantTitle || variants.nodes[0].label}
              </Text>

              <Pressable
                onPress={async () => {
                  descriptionState == "hidden" ? setDescriptionState("visible")  : setDescriptionState("hidden");
                }}
               
                border="none"
                cornerRadius="none"
                padding="none"
              >
                <InlineLayout blockAlignment="center"  columns={[82, "fill", "auto"]}>
                  <Text>Description</Text>
                  <Icon source="chevronDown" size="small" />

                 
                </InlineLayout>
              </Pressable>
              {/* <Link appearance="monochrome"
         
             
            >
              Description
            </Link> */}
            
            </BlockStack>

            <InlineLayout
              spacing="base"
              // Use the `columns` property to set the width of the columns
              // Image: column should be 64px wide
              // BlockStack: column, which contains the title and price, should "fill" all available space
              // Button: column should "auto" size based on the intrinsic width of the elements
              blockAlignment="center"
              columns={["36%", "fill"]}
            >
              <Text id="productPrice" appearance="subdued">
                {variantPrice || renderPrice}
              </Text>

              <Button
                kind="secondary"
                loading={adding}
                accessibilityLabel={`Add ${title} to cart`}
                onPress={async () => {
                  setAdding(true);
                  // Apply the cart lines change
                  const result = await applyCartLinesChange({
                    type: "addCartLine",
                    merchandiseId: variantId || variants.nodes[0].value,
                    quantity: 1,
                  });
                  setAdding(false);
                  if (result.type === "error") {
                    // An error occurred adding the cart line
                    // Verify that you're using a valid product variant ID
                    // For example, 'gid://shopify/ProductVariant/123'
                    setShowError(true);
                    console.error(result.message);
                  }
                }}
              >
                Add
              </Button>
            </InlineLayout>
          </InlineLayout>
          <Text visibility={`${descriptionState}`}>{description}</Text>
          <Select
            label="Variant"
            value={`${variantId || variants.nodes[0].value}`}
            onChange={(id) => {
              let itemPrice = null;
              let varImage = null;
              let varLabel = null;
              variants.nodes.forEach((variant) => {
                if (variant.value == id) {
                  // console.log(i18n.formatCurrency(variant.price.amount))
                  itemPrice = i18n.formatCurrency(variant.price.amount);
                  varImage = variant.image.originalSrc;
                  varLabel = variant.label;
                }
              });
              setVariantPrice(itemPrice);
              setVariantImage(varImage);
              setVariantId(id);
              setVariantTitle(varLabel);
            }}
            options={variants.nodes}
          />
        </BlockStack>
        {showError && (
          <Banner status="critical">
            There was an issue adding this product. Please try again.
          </Banner>
        )}
      </BlockStack>
    );
  } else {
    return (
      <BlockStack spacing="loose">
        <Divider />
        <Heading level={2}>You might also like</Heading>
        <BlockStack spacing="loose">
          <InlineLayout
            spacing="base"
            // Use the `columns` property to set the width of the columns
            // Image: column should be 64px wide
            // BlockStack: column, which contains the title and price, should "fill" all available space
            // Button: column should "auto" size based on the intrinsic width of the elements
            columns={[64, "fill", "auto"]}
            blockAlignment="center"
          >
            <Image
              border="base"
              borderWidth="base"
              borderRadius="loose"
              source={imageUrl}
              description={title}
              aspectRatio={1}
            />
            <BlockStack spacing="base">
              <Text size="medium" emphasis="strong">
                {title}
              </Text>
             

              
              <Pressable
                onPress={async () => {
                
                 if(descriptionState == "hidden") {
                  setDescriptionState("visible") 
                 }
                 else {
                  setDescriptionState("hidden")
                 }
                  
                }}
               
                border="none"
                cornerRadius="none"
                padding="none"
              >
                <InlineLayout blockAlignment="center"  columns={[82, "fill", "auto"]}>
                  <Text>Description</Text>
                  <Icon source="chevronDown" size="small" />

                 
                </InlineLayout>
              </Pressable>
            </BlockStack>
            
            <InlineLayout
              spacing="base"
              // Use the `columns` property to set the width of the columns
              // Image: column should be 64px wide
              // BlockStack: column, which contains the title and price, should "fill" all available space
              // Button: column should "auto" size based on the intrinsic width of the elements
              blockAlignment="center"
              columns={["40%", "fill"]}
            >
            <Text appearance="subdued">{renderPrice}</Text>
            <Button
              kind="secondary"
              loading={adding}
              accessibilityLabel={`Add ${title} to cart`}
              onPress={async () => {
                setAdding(true);
                // Apply the cart lines change

                const result = await applyCartLinesChange({
                  type: "addCartLine",
                  merchandiseId: variants.nodes[0].value,
                  quantity: 1,
                });
                setAdding(false);
                if (result.type === "error") {
                  // An error occurred adding the cart line
                  // Verify that you're using a valid product variant ID
                  // For example, 'gid://shopify/ProductVariant/123'
                  setShowError(true);
                  console.error(result.message);
                }
              }}
            >
              Add
            </Button>
            </InlineLayout>
          </InlineLayout>

          <Text visibility={`${descriptionState}`}>{description}</Text>
        </BlockStack>
        {showError && (
          <Banner status="critical">
            There was an issue adding this product. Please try again.
          </Banner>
        )}
      </BlockStack>
    );
  }
}
