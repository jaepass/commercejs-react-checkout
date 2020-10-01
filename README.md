# Commerce.js React Cart

Add cart functionality to your React application using Commerce.js.

## Overview

The goal of this guide is to demonstrate how to add cart functionality to your products page so multiple products can be added to a cart, increase or decrease the item quantities, and clear items from the cart.

Below is what we will be accomplishing with this guide:

1. Retrieve and/or create a cart in our application
2. Add products to cart
3. Update line items in cart
4. Remove line items from cart
5. Empty cart contents

[See live demo](https://commercejs-react-cart.netlify.app/)

## Requirements

To start this guide you will need:

- An IDE or code editor
- NodeJS, at least v8
- npm or yarn
- React devtools (recommended)

## Prerequisites

This project assumes you have some knowledge of the below concepts before starting:

- Basic knowledge of JavaScript
- Some knowledge of React
- An idea of the Jamstack architecture and how APIs work

### Some things to note

- The purpose of this guide is to focus on the Commerce.js integration and using React to build the application, we will therefore not be covering any styling details

## Add cart functionality

The [cart](https://commercejs.com/docs/sdk/cart/) resource in Chec comes equipped with multiple intuitive endpoints to help develop a seamless shopping cart experience with Commerce.js. You will be interacting with the cart endpoint in multiple components in your application:
- In your product listing page where you can add items to the cart
- In the cart component where you will be rendering, updating, removing, and clearing the cart items

### 1. Retrieve cart

First, go to your app component and pick up where we left off from the previous guide. Follow the same logic to fetch your cart data when your application mounts to the DOM, the same as fetching your products. Inside your constructor where you previously initialized the products state, add an initial cart state and set it to an empty object.

```jsx
// App.js
constructor(props) {
  super(props);

  this.state = {
    products: [],
    cart: {},
  }
}
```

Next, retrieve the current cart in session with the `cart.retrieve()`
[method](https://commercejs.com/docs/sdk/cart#retrieve-cart). Commerce.js automatically creates a cart for you if one does not exist in the current browser session. Commerce.js tracks the current cart ID with a cookie, and stores the entire cart and its contents for 30 days. This means that users returning to your website will still have their cart contents available for up to 30 days.

With the [Cart API](https://commercejs.com/docs/api/#carts) and [cart methods](https://commercejs.com/docs/sdk/cart) in Commerce.js, the otherwise complex cart logic can be easily implemented. Now you should add a new cart method underneath `fetchProducts()`.

```jsx
// App.js
/**
 * Retrieve the current cart or create one if one does not exist
 * https://commercejs.com/docs/sdk/cart
 */
fetchCart() {
  commerce.cart.retrieve().then((cart) => {
    this.setState({ cart });
  }).catch((error) => {
    console.error('There was an error fetching the cart', error);
  });
}
```

Above, you created a new helper function called `fetchCart()` that will call the `cart.retrieve()` Commerce.js method to retrieve the cart in session or create a new one if one does not exist. When this method resolves, use `this.setState()` to set the returned cart data object to the cart state. Otherwise, handle a failed request with an error message. In the lifecycle method `componentDidMount`, you'll also need to execute the `fetchCart()` function when the component mounts.

```js
// App.js
componentDidMount() {
  this.fetchProducts();
  this.fetchCart();
}
```

The `cart.retrieve()` method will run, resolve, and the returned data will be stored in the cart state. Fire up your page, and the result should be similar to the cart object response below:

```json
{
  "id": "cart_Mo11bJPOKW9xXo",
  "created": 1599850065,
  "last_updated": 1599850065,
  "expires": 1602442065,
  "total_items": 0,
  "total_unique_items": 0,
  "subtotal": {
    "raw": 0,
    "formatted": "0.00",
    "formatted_with_symbol": "$0.00",
    "formatted_with_code": "0.00 USD"
  },
  "currency": {
    "code": "USD",
    "symbol": "$"
  },
  "discount_code": [],
  "hosted_checkout_url": "https://checkout.chec.io/cart/cart_Mo11bJPOKW9xXo",
  "line_items": []
}
```

### 2. Add to cart

In Commerce.js, one of the main cart methods is [add to cart](https://commercejs.com/docs/sdk/cart/#add-to-cart).
This method calls the `POST v1/carts/{cart_id}` Cart API endpoint. With your cart object response, you can start to interact with and add the necessary event handlers to handle your cart functionalities. Similar to how you can pass props as custom attributes, you can do that with native and custom events via callbacks. Because you will need to display a button to handle your add to cart functionality, go back to the `ProductItem.js` component to add that in the product card.
Create a button tag and pass a function to the React native `onClick` attribute which will be the function handler you want to handle your event, the `handleAddToCart` event handler in this case.

```jsx
// ProductItem.js
<button
  name="Add to cart"
  className="product__btn"
  onClick={this.handleAddToCart}
>
  Quick add
</button>
```

In React, data being passed down from a parent component to a child component is called props. In order to listen for any events in a child component, you can use callback functions. After attaching a click event in your **Quick add** button to call the `handleAddToCart` event handler, you will now need to create the handler function.

```jsx
// ProductItem.js
handleAddToCart() {
  this.props.onAddToCart(this.props.product.id, 1);
}
```

Inside the handler function `handleAddToCart()`, execute a callback function which will be passed in from the `App.js` component via props - `onAddToCart`. Note that you will get to creating and passing this callback in the next section. A callback can receive any arguments, and the `App.js` component will have access to them. In this case, pass `this.props.product.id` and the quantity `1` as these are the request parameters for using the `commerce.cart.add()` method. Next, be sure to bind the handler in the constructor in order to give `this` scope to the handler.

```jsx
// ProductItem.js
constructor(props) {
  super(props);

  this.handleAddToCart = this.handleAddToCart.bind(this);
}
```

Let's now head back to `App.js` to pass in your callback `onAddToCart` in the `ProductsListing` component instance and attach a `handleAddToCart()` method where you will be making the "add to cart" request to the Chec API.

```jsx
// App.js
<ProductsList
  products={products}
  onAddToCart={this.handleAddToCart}
/>
```

The data `product.id` and the quantity `1` that were passed in to the callback function in `ProductItem` component will be received in the handling method. Go ahead and create the helper handling method and call it `handleAddToCart()` in the `App.js` component. You will also need
to pass in parameters `productId` and `quantity` as variables.

```jsx
/**
 * Adds a product to the current cart in session
 * https://commercejs.com/docs/sdk/cart/#add-to-cart
 *
 * @param {string} productId The ID of the product being added
 * @param {number} quantity The quantity of the product being added
 */
handleAddToCart(productId, quantity) {
  commerce.cart.add(productId, quantity).then((item) => {
    this.setState({ cart: item.cart })
  }).catch((error) => {
    console.error('There was an error adding the item to the cart', error);
  });
}
```

The above helper handle makes a call to the `commerce.cart.add` method. When the promise resolves, set the state again by updating the cart with the new cart data. Upon a successful post request to add a new product to cart, you should see the below example abbreviated response with a new line item in the cart object:

```json
{
  "success": true,
  "event": "Cart.Item.Added",
  "line_item_id": "item_dKvg9l6vl1bB76",
  "product_id": "prod_8XO3wpDrOwYAzQ",
  "product_name": "Coffee",
  "media": {
    "type": "image",
    "source": "https://cdn.chec.io/merchants/18462/images/2f67eabc1f63ab67377d28ba34e4f8808c7f82555f03a9d7d0148|u11 1.png"
  },
  "quantity": 1,
  "line_total": {
    "raw": 7.5,
    "formatted": "7.50",
    "formatted_with_symbol": "$7.50",
    "formatted_with_code": "7.50 USD"
  },
  "_event": "Cart.Item.Added",
  "cart": {
    "id": "cart_Ll2DPVQaGrPGEo",
    "created": 1599854326,
    "last_updated": 1599856885,
    "expires": 1602446326,
    "total_items": 3,
    "total_unique_items": 3,
    "subtotal": {
      "raw": 66.5,
      "formatted": "66.50",
      "formatted_with_symbol": "$66.50",
      "formatted_with_code": "66.50 USD"
    },
    "hosted_checkout_url": "https://checkout.chec.io/cart/cart_Ll2DPVQaGrPGEo",
    "line_items": [
      {
        "id": "item_7RyWOwmK5nEa2V",
        "product_id": "prod_NqKE50BR4wdgBL",
        "name": "Kettle",
        "media": {
          "type": "image",
          "source": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png"
        },
        "quantity": 1,
        "price": {
          "raw": 45.5,
          "formatted": "45.50",
          "formatted_with_symbol": "$45.50",
          "formatted_with_code": "45.50 USD"
        },
        "line_total": {
          "raw": 45.5,
          "formatted": "45.50",
          "formatted_with_symbol": "$45.50",
          "formatted_with_code": "45.50 USD"
        },
        "variants": []
      }
    ]
  }
}
```

In the JSON response, you can note that the added product is now given associated `line_items` details such as its `line_item_id`, and `line_total`. With this data, you can now create your cart component and render cart details like a list of added items.

### 3. Create a cart component

Start by creating a cart component in the components folder. Here you will want to follow the same pattern to try to encapsulate and break down smaller components to be consumable by parent components. This way you continue to keep your application DRY as well and keep your logic separated.

In your components folder, first create a `Cart.js` as a class component which is what will render the main cart container.

```jsx
import React, { Component } from 'react';
import CartItem from './CartItem';

class Cart extends Component {
  renderEmptyCart() {
    const { cart } = this.props;
    if (cart.total_unique_items > 0) {
      return;
    }

    return (
      <p className="cart__none">
        You have no items in your shopping cart, start adding some!
      </p>
    );
  }

  renderCart() {
    const { cart } = this.props;
    if (cart.total_unique_items === 0) {
      return;
    }

    return (
      <>
        {cart.line_items.map(lineItem => (
          <CartItem
            item={lineItem}
            key={lineItem.id}
            className="cart__inner"
          />
        ))}
        <div className="cart__total">
          <p className="cart__total-title">Subtotal:</p>
          <p className="cart__total-price">{cart.subtotal.formatted_with_symbol}</p>
        </div>
      </>
    );
  }

  render() {
    return (
      <div className="cart">
        <h4 className="cart__heading">Your Shopping Cart</h4>
        { this.renderEmptyCart() }
        { this.renderCart() }
      </div>
    );
  };
};

export default Cart;
```

In `Cart.js`, first import in a `CartItem` component you will create next. You've split up our rendering methods
into a couple of parts:

* Render a message when the cart is empty
* Render the contents of the cart when it it not empty
* Render a wrapper that calls the above two methods

To render an empty cart message we'll first check that the cart is empty and return early if it isn't. You can use the
 `cart.total_unique_items` property to determine this. You can return a simple paragraph tag with a message in it.

When rendering the cart you'll do the opposite check from `renderEmptyCart()` and check that the cart _does_ have items
in it, returning early if not. Next, you will want to render out the individual line items that exists in the cart
object when items are added to cart. You're rendering a `CartItem` component for each line item, providing the line
item object as the `item` prop, and assigning it a unique `key` with the line item's `id` property.

Lastly, you'll want to render some cart subtotals. You can use the `cart.subtotal.formatted_with_symbol` property
to get the cart's subtotal with the currency symbol (e.g. `$19.95`). This property will be updated whenever your cart
object changes in the state, so your cart updates in real time!


Next, create the `CartItem.vue` class component which will render each line item details such as the item image, name, price, and quantity.

```jsx
// Cart.vue
class CartItem extends Component {
  render() {
    const { item } = this.props;

    return (
      <div className="cart-item">
        <img className="cart-item__image" src={item.media.source} alt={item.name} />
        <div className="cart-item__details">
          <h4 className="cart-item__details-name">{item.name}</h4>
          <div className="cart-item__details-qty">
            <button type="button" title="Reduce quantity">-</button>
            <p>{item.quantity}</p>
            <button type="button" title="Increase quantity">+</button>
          </div>
          <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
        </div>
        <button type="button">Remove</button>
      </div>
    );
  };
};

export default CartItem;
```

For now, build out the JSX template with the `item` prop to parse `item.media.source` as the `src` value, the `item.name`, the `item.quanity` and the `item.line_total.formatted_with_symbol`. Later on, you will be adding events to the buttons above to have the functionality to update and remove each line item.

Now go back to your `App.js`, call the cart component instance and pass in the cart (from your state) as a prop.

```jsx
// App.js
<Cart
  cart={cart}
/>
```

At this stage, you should be able to see a minimal cart component rendered out in your main application view. Let's continue to add more cart functionality and build a more detailed cart interface.

### 4. Update cart items

Going back to the `CartItem.vue` component, you can start to implement the first cart line item action using the Commerce.js [method](https://commercejs.com/docs/sdk/cart#update-cart) `commerce.cart.update()`. This request uses the `PUT v1/carts/{cart_id}/items/{line_item_id}` API to update the quantity or variant for the line item ID in the cart. For this guide, you will only be working with the main variant of the product item.

Add a new handler in the `CartItem.vue` component to call a callback function `onUpdateCartQty`. Pass in `lineItemId` and `newQuantity` to this callback function. Again, you will need to bind the handler to the component's instance.

```js
// CartItem.vue
constructor(props) {
  super(props);

  this.handleUpdateCartQty = this.handleUpdateCartQty.bind(this);
}

handleUpdateCartQty(lineItemId, newQuantity) {
  this.props.onUpdateCartQty(lineItemId, newQuantity);
}
```

Above, you created a handler function `handleUpdateCartQty()` to call a `onUpdateCartQty()` callback property. The parameters passed in will be available to the parent component, our `App.js` in this case, which will handle and execute the updating of line items in your cart.

Now in your CartItem component, hook up your "update cart quantity" functionality with a click handler. Between the item quantity element, attach your custom `handleUpdateCartQty` method to button click events. In the first button, implement a click handler to decrease the line item quantity by 1 and in the second button to increase it by 1.

```jsx
// CartItem.js
<div className="cart-item">
  <img className="cart-item__image" src={item.media.source} alt={item.name} />
  <div className="cart-item__details">
    <h4 className="cart-item__details-name">{item.name}</h4>
    <div className="cart-item__details-qty">
      <button type="button" onClick={() => this.handleUpdateCartQty(item.id, item.quantity - 1)} title="Decrease quantity">-</button>
      <p>{item.quantity}</p>
      <button type="button" onClick={() => this.handleUpdateCartQty(item.id, item.quantity + 1)} title="Increase quantity">+</button>
    </div>
    <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
  </div>
  <button type="button" className="cart-item__remove">Remove</button>
</div>
```

When the click event fires it will call the `handleUpdateCartQty()` method with the quantity
of the item decreased or increased by 1.

For the `App.js` component to handle the callback function, create an event handler for the updating of the line item quantities.

```jsx
// App.vue
/**
 * Updates line_items in cart
 * https://commercejs.com/docs/sdk/cart/#update-cart
 *
 * @param {string} lineItemId ID of the cart line item being updated
 * @param {number} quantity New line item quantity
 */
handleUpdateCartQty(lineItemId, quantity) {
  commerce.cart.update(lineItemId, { quantity }).then((resp) => {
    this.setState({ cart: resp.cart })
  }).catch((error) => {
    console.log('There was an error updating the cart items', error);
  });
}
```

In this helper function, call the `commerce.cart.update()` endpoint with `lineItemId` and `quantity`. When you fire the update button in your `CartItem.js` component, this event handler will run and will update the state with the new cart object when it resolves. You'll also need to bind the handler to the `App.js` component in it's `constructor` method.

```js
constructor(props) {
  super(props);
  // ...
  this.handleUpdateCartQty = this.handleUpdateCartQty.bind(this);
}
```

Now hook up your callback function as a prop to the `cart` component instance in `App.js`:

```jsx
// App.js
<Cart
  cart={cart}
  onUpdateCartQty={this.handleUpdateCartQty}
/>
```

Go ahead and click an update button for one of the line items. Upon a successful request you will receive a response similar to the below abbreviated data:

```json
{
  "success": true,
  "event": "Cart.Item.Updated",
  "line_item_id": "item_7RyWOwmK5nEa2V",
  "product_id": "prod_NqKE50BR4wdgBL",
  "product_name": "Kettle",
  "media": {
    "type": "image",
    "source": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png"
  },
  "quantity": 2,
  "line_total": {
    "raw": 91,
    "formatted": "91.00",
    "formatted_with_symbol": "$91.00",
    "formatted_with_code": "91.00 USD"
  },
  "_event": "Cart.Item.Updated",
  "cart": {
    "id": "cart_Mo11z2Xn30K7Wo",
    "created": 1600021165,
    "last_updated": 1600125011,
    "expires": 1602613165,
    "total_items": 2,
    "total_unique_items": 1,
    "subtotal": {
      "raw": 91,
      "formatted": "91.00",
      "formatted_with_symbol": "$91.00",
      "formatted_with_code": "91.00 USD"
    },
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "discount_code": [],
    "hosted_checkout_url": "https://checkout.chec.io/cart/cart_Mo11z2Xn30K7Wo",
    "line_items": [
      {
        "id": "item_7RyWOwmK5nEa2V",
        "product_id": "prod_NqKE50BR4wdgBL",
        "name": "Kettle",
        "media": {
          "type": "image",
          "source": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png"
        },
        "quantity": 2,
        "price": {
          "raw": 45.5,
          "formatted": "45.50",
          "formatted_with_symbol": "$45.50",
          "formatted_with_code": "45.50 USD"
        },
        "line_total": {
          "raw": 91,
          "formatted": "91.00",
          "formatted_with_symbol": "$91.00",
          "formatted_with_code": "91.00 USD"
        },
        "variants": []
      }
    ]
  }
}
```

### 5. Remove items from cart

Now that you have the ability to update the quantity of individual line items in your cart, you might also want the to be able to remove that line item from your cart. The Commerce.js `commerce.cart.remove()` [method](https://commercejs.com/docs/sdk/cart#remove-from-cart) helps with this.

Go back to your `CartItem.js` component to add the "remove item from cart" logic. Underneath `handleUpdateCartQty()`, add a helper method and call it `handleRemoveFromCart()`.

```js
// CartItem.js
constructor(props) {
  super(props);
  // ...
  this.handleRemoveFromCart = this.handleRemoveFromCart.bind(this);
}

handleRemoveFromCart(lineItemId) {
  this.props.onRemoveFromCart(lineItemId);
}
```

Once again, this handler method will be the one to call a `onRemoveFromCart()` callback function which will make the `lineItemId` data available to the `App.js` component for which line item is being removed. An updated `CartItem.js` component with added handlers both bound to the component will look like this:

```jsx
constructor(props) {
  super(props);

  this.handleUpdateCartQty = this.handleUpdateCartQty.bind(this);
  this.handleRemoveFromCart = this.handleRemoveFromCart.bind(this);
}

handleUpdateCartQty(lineItemId, newQuantity) {
  this.props.onUpdateCartQty(lineItemId, newQuantity);
}

handleRemoveFromCart(lineItemId) {
  this.props.onRemoveFromCart(lineItemId);
}
```

Attach the `handleRemoveFromCart()` method to an isolated **Remove** button as well. When this click handler fires, the associated line item will be removed from the cart object.

```jsx
// CartItem.vue
render() {
  const { item } = this.props;

  return (
    <div className="cart-item">
      <img className="cart-item__image" src={item.media.source} alt={item.name} />
      <div className="cart-item__details">
        <h4 className="cart-item__details-name">{item.name}</h4>
        <div className="cart-item__details-qty">
          <button type="button" onClick={() => this.handleUpdateCartQty(item.id, item.quantity - 1)} title="Decrease quantity">-</button>
          <p>{item.quantity}</p>
          <button type="button" onClick={() => this.handleUpdateCartQty(item.id, item.quantity + 1)} title="Increase quantity">+</button>
        </div>
        <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
      </div>
      <button type="button" className="cart-item__remove" onClick={() => this.handleRemoveFromCart(item.id)}>Remove</button>
    </div>
  );
};
```

Finally, in `App.js`, create the event handler to make the request to the `commerce.cart.remove()` method. This is the event handler you
pass to your `CartItem` in the `onRemoveFromCart` prop. The `commerce.cart.remove()` method takes an `lineItemId` argument and once the promise resolves, the new cart object has one less of the removed line item (or the item removed entirely if you decrease down to a quantity of zero).

```js
// App.js
/**
 * Removes line item from cart
 * https://commercejs.com/docs/sdk/cart/#remove-from-cart
 *
 * @param {string} lineItemId ID of the line item being removed
 */
handleRemoveFromCart(lineItemId) {
  commerce.cart.remove(lineItemId).then((resp) => {
    this.setState({
      cart: resp.cart
    })
  }).catch((error) => {
    console.error('There was an error removing the item from the cart', error);
  });
}
```

Update your `App` component to provide the `onRemoveFromCart` prop to the `Cart` component. Make sure you bind
`handleRemoveFromCart` to the current instance in your constructor too.

```jsx
// App.js
constructor(props) {
  super(props);
  // ...
  this.handleRemoveFromCart = this.handleRemoveFromCart.bind(this);
}

render() {
  const { cart } = this.state;

  return (
    <Cart
      cart={cart}
      onUpdateCartQty={this.handleUpdateCartQty}
      onRemoveFromCart={this.handleRemoveFromCart}
    />
  );
}
```

With a successful request your response will look like this:

```json
{
  "success": true,
  "event": "Cart.Item.Removed",
  "line_item_id": "item_7RyWOwmK5nEa2V",
  "_event": "Cart.Item.Removed",
  "cart": {
    "id": "cart_Mo11z2Xn30K7Wo",
    "created": 1600021165,
    "last_updated": 1600129181,
    "expires": 1602613165,
    "total_items": 0,
    "total_unique_items": 0,
    "subtotal": {
      "raw": 0,
      "formatted": "0.00",
      "formatted_with_symbol": "$0.00",
      "formatted_with_code": "0.00 USD"
    },
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "discount_code": [],
    "hosted_checkout_url": "https://checkout.chec.io/cart/cart_Mo11z2Xn30K7Wo",
    "line_items": []
  }
}
```

### 6. Clear cart

Lastly, the cart action to go over in this guide is the `commerce.cart.empty()`
[method](https://commercejs.com/docs/sdk/cart#empty-cart). The `empty()` method completely clears the contents of the current cart.

Since removal of the entire cart contents will happen at the cart component level, intercept an event for it directly in the cart UI. Go back to your `Cart` component and add a click handler which will call `handleEmptyCart()`. Underneath the component instance of `CartItem`, add in the button below:

```jsx
// Cart.js
<button className="cart__btn-empty" onClick={this.handleEmptyCart}>Empty cart</button>
```

This button element will go into the `renderCart()` method you added earlier, which only renders if the cart has line
items in it.

Now, add a new handler method in the `Cart.js` component to call the callback prop `onEmptyCart` that will be passed down from `App.js`.

```jsx
// Cart.js
constructor(props) {
  super(props);
  // ...
  this.handleEmptyCart = this.handleEmptyCart.bind(this);
}

handleEmptyCart() {
  this.props.onEmptyCart();
}
```

In `App.js`, create an event handler to empty the cart. The `commerce.cart.empty()` method has no arguments - it simply deletes all the items in the cart.

```jsx
// App.js
/**
 * Empties cart contents
 * https://commercejs.com/docs/sdk/cart/#remove-from-cart
 */
handleEmptyCart() {
  commerce.cart.empty().then((resp) => {
    this.setState({ cart: resp.cart })
  }).catch((error) => {
    console.error('There was an error emptying the cart', error);
  });
}
```

Now with the handler function created, hook it up to your cart component. Once again, don't forget to bind to the current instance
in your constructor.

```jsx
// App.js
constructor(props) {
  super(props);
  // ...
  this.handleEmptyCart = this.handleEmptyCart.bind(this);
}
render() {
  const { cart } = this.state;

  return (
    <Cart
      cart={cart}
      onUpdateCartQty={this.handleUpdateCartQty}
      onRemoveFromCart={this.handleRemoveFromCart}
      onEmptyCart={this.handleEmptyCart}
    />
  );
}
```

With a successful request you'll get a response like this, and your cart will now be empty again:

```json
{
  "success": true,
  "event": "Cart.Item.Removed",
  "line_item_id": "item_1ypbroE658n4ea",
  "_event": "Cart.Item.Removed",
  "cart": {
    "id": "cart_Mo11z2Xn30K7Wo",
    "created": 1600021165,
    "last_updated": 1600131015,
    "expires": 1602613165,
    "total_items": 0,
    "total_unique_items": 0,
    "subtotal": {
      "raw": 0,
      "formatted": "0.00",
      "formatted_with_symbol": "$0.00",
      "formatted_with_code": "0.00 USD"
    },
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "discount_code": [],
    "hosted_checkout_url": "https://checkout.chec.io/cart/cart_Mo11z2Xn30K7Wo",
    "line_items": []
  }
}
```

## That's it!

And there you have it, you have now wrapped up part two of the Commerce.js React guide on implementing cart
functionality in your application. The next guide will continue from this to add a checkout flow.

You can find the full finished code in [GitHub here](https://github.com/jaepass/commercejs-react-cart)!
