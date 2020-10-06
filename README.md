# Commerce.js React Checkout

This is a guide on adding checkout order capture functionality to React application using Commerce.js. This is a
continuation from the previous guide on implementing cart functionality.

[See live demo](https://commercejs-react-checkout.netlify.app/)

## Overview

The aim for this guide is to create a checkout page to capture our cart items into an order as well and add a
confirmation page to display a successful order. Below outlines what this guide will achieve:

1. Add page routing to the application
2. Generate a checkout token to capture the order
3. Create a checkout page with a form
4. Create a confirmation page to display an order reference and receipt

## Requirements

What you will need to start this project:

- An IDE or code editor
- NodeJS, at least v8
- npm or yarn
- React devtools (recommended)

## Prerequisites

This project assumes you have some knowledge of the below concepts before starting:

- Basic knowledge of JavaScript
- Some knowledge of React
- An idea of the JAMstack architecture and how APIs work

## Some things to note

- The purpose of this guide is to focus on the Commerce.js checkout integration, using Vue.js to build out the
  application. We will therefore not be covering styling details
- We will not be going over any Font Awesome usage
- We will not be going over any UI details that do not pertain much to Commerce.js methods


## Checkout

### 1. Set up routing

For fully functional SPAs (single page applications) to scale, you will need to add routing in order to navigate to
various view pages such to a cart or checkout flow. For a Commerce.js application, this is where you have the full
flexibility of creating fully custom checkout flow. Let's jump right back to where we left off from the previous cart
guide and add [react-router-dom](https://reactrouter.com/web/guides), a routing library for React web application, to
our project. You will only need to install `react-router-dom` and not `react-router`, which is for React Native. Install
the routing library by running the below command.

```bash
yarn add react-router-dom
# OR
npm i react-router-dom
```

After installing, you'll need to make sure the router component is rendered at the root of your element hierarchy to
have access to the routes you will be setting up. First, go into `src/index.js`, import the
`[BrowserRouter](https://reactrouter.com/web/guides/primary-components)` component in and wrap the `<App>` element in
the router component.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.render(
    <Router>
        <App />
    </Router>
, document.getElementById("root"));
```

Now that you've added routing to serve your whole application, you'll now need to add page components that you'll be
creating in the next section to the [Route Matchers](https://reactrouter.com/web/guides/primary-components) components
`<Route>` and `<Switch>` in `App.js`.

First, import the Route Matchers components `Route` and `Switch` from `react-router-dom`.

```jsx
import { Switch, Route } from 'react-router-dom'
```

Next, in your render function, wrap your `<Cart>` and `<Products>` components in a `<Route>` element.

```jsx
<Route
  path="/"
  exact
  render={(props) => {
    return (
      <>
        <Hero
          merchant={merchant}
        />
        { this.renderCartNav() }
        {isCartVisible &&
          <Cart
            {...props}
            cart={cart}
            onUpdateCartQty={this.handleUpdateCartQty}
            onRemoveFromCart={this.handleRemoveFromCart}
            onEmptyCart={this.handleEmptyCart}
          />
        }  
        <ProductsList
          {...props}
          products={products}
          onAddToCart={this.handleAddToCart}
        />
      </>
    );
  }}
/>
```

Let's walk through the above code block - The `<Route>` includes the attributes:
- `path`'s value points to the path you want to route to
- `render` outputs the components included in the view page indicated at the `path` value. You can optionally pass
  `props` to the render attribute.
- `exact` attribute ensures the `<Route path>` matches the entire URL.

Now that you've set the initial route component, include a `<Checkout>` component which you will get to creating next.

```jsx
return (
  <div className="app">
    <Switch>
      <Route
        path="/"
        exact
        render={(props) => {
          return (
            <>
              <Hero
                merchant={merchant}
              />
              { this.renderCartNav() }
              {isCartVisible &&
                <Cart
                  {...props}
                  cart={cart}
                  onUpdateCartQty={this.handleUpdateCartQty}
                  onRemoveFromCart={this.handleRemoveFromCart}
                  onEmptyCart={this.handleEmptyCart}
                />
              } 
              <ProductsList
                {...props}
                products={products}
                onAddToCart={this.handleAddToCart}
              />
            </>
          );
        }}
      />
      <Route
        path="/checkout"
        exact
        render={(props) => {
          return (
            <Checkout
              {...props}
              cart={cart}
            />
          )
        }}
      />
    </Switch>
  </div>
);
```

Note the `<Switch>` element, which was imported from the `react-router-dom` module earlier, wrapping around the
`<Route>`s. When the `<Switch>`element renders, it will search through the child elements to render the one whose path
matches the current URL. 

Secondly, a new `<Route>` element was added which returns a `<Checkout>` component with a path pointing to `/checkout`.
Pass `{...props}` `cart={cart}` to ensure you have access to them in the checkout component. You will create this
component in the upcoming section. This is all the routing setup you will need for now until the remaining view
components are added later in the guide.

Lastly, the checkout page will need to be pushed into view from the cart checkout button created in the previous cart
guide. Go into `Cart.js` to import the `Link` component in, a navigation component, and refactor the checkout `<button>`
to a `<Link>` element.

```jsx
<div className="cart__footer">
  <button className="cart__btn-empty" onClick={this.handleEmptyCart}>Empty cart</button>
  <Link
    className="cart__btn-checkout"
    to="/checkout"
  >
    Checkout
  </Link> 
</div>
```

Now, if you click the link, you should be route to a blank page with the url ending in a `/checkout`.

### 2. Create checkout page

Earlier in step 1 we created the appropriate route components to navigate to a checkout page. You will now create that
view page to render when the router points to the `/checkout` path. 

First, let's create a new folder `src/pages` and a `Checkout.js` page component. This page component is going to get
real hefty quite fast, but it will be broken it down in chunks throughout the rest of this guide.

The [Checkout resource](https://commercejs.com/docs/sdk/checkout) in Chec helps to handle one of the most complex moving
parts of an eCommerce application. The Checkout endpoint comes with the core `commerce.checkout.generateToken()` and
`commerce.checkout.capture()` methods along with [Checkout
helpers](https://commercejs.com/docs/sdk/concepts#checkout-helpers) - additional helper functions for a seamless
purchasing flow which will be touched on more later.

In the `Checkout.js` page component, let's start first by initializing all the data you will need in this component to
build the checkout page and form. 

Commerce.js provides a powerful method
[`commerce.checkout.generateToken()`](https://commercejs.com/docs/sdk/checkout#generate-token) to capture all the data
needed from the cart and initiate the checkout process simply by providing a cart ID, a product ID, or a product's
permalink as an argument. You'll use a cart ID since we've already built the cart.

Let's create a class component then initialize a `checkoutToken` in the constructor's state.

```jsx
class Checkout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checkoutToken: {},
    }
  };

  render() {
    return (
      <div></div>
    );
  };
};

export default Checkout;
```

Next, create the helper function `generateCheckoutToken()` that will generate the checkout token needed to capture the
checkout.

```jsx
/**
*  Generates a checkout token
*  https://commercejs.com/docs/sdk/checkout#generate-token
*/
generateCheckoutToken() {
  const { cart } = this.props;
  if(cart.total_items > 0) {
    commerce.checkout.generateToken(cart.id, { type: 'cart' })
      .then((token) => {
        this.setState({ checkoutToken: token });
    }).catch((error) => {
      console.log('There was an error in generating a token', error);
    });
  }
}
```

There are four core properties that are required to process an order using Commerce.js - `customer`, `shipping`,
`fulfillment`, and `payment`. Let's start to define the fields you need to capture in the form. The main property
objects will all go under a `form` object. You will then bind these properties to each single field in the render
function with the `value` attribute.

```jsx
class Checkout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checkoutToken: {},
      form: {
        customer: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'janedoe@email.com',
        },
        shipping: {
          name: 'Jane Doe',
          street: '123 Fake St',
          city: 'San Francisco',
          stateProvince: 'CA',
          postalZipCode: '94107',
          country: 'US',
        },
        fulfillment: {
          shippingOption: '',
        },
        payment: {
          cardNum: '4242 4242 4242 4242',
          expMonth: '01',
          expYear: '2023',
          ccv: '123',
          billingPostalZipCode: '94107',
        },
      },
      shippingCountries: {},
      shippingSubdivisions: {},
      shippingOptions: [],
    }
  };

  render() {
    return (
      <div></div>
    );
  };
};

export default Checkout;
```

And in the render function, as mentioned, bind the data to each of the `value` attributes in the input
elements. The inputs will be pre-filled with the state data created above.

```jsx
renderCheckoutForm() {
  const { shippingCountries, shippingSubdivisions, shippingOptions } = this.state;

  return (
    <form className="checkout__form">
      <h4 className="checkout__subheading">Customer information</h4>

        <label className="checkout__label" htmlFor="firstName">First name</label>
        <input className="checkout__input" type="text" value={this.state.form.customer.firstName} name="firstName" placeholder="Enter your first name" required />

        <label className="checkout__label" htmlFor="lastName">Last name</label>
        <input className="checkout__input" type="text" value={this.state.form.customer.lastName}name="lastName" placeholder="Enter your last name" required />

        <label className="checkout__label" htmlFor="email">Email</label>
        <input className="checkout__input" type="text" value={this.state.form.customer.email} name="email" placeholder="Enter your email" required />

      <h4 className="checkout__subheading">Shipping details</h4>

        <label className="checkout__label" htmlFor="fullname">Full name</label>
        <input className="checkout__input" type="text" value={this.state.form.shipping.name} name="name" placeholder="Enter your shipping full name" required />

        <label className="checkout__label" htmlFor="street">Street address</label>
        <input className="checkout__input" type="text" value={this.state.form.shipping.street} name="street" placeholder="Enter your street address" required />

        <label className="checkout__label" htmlFor="city">City</label>
        <input className="checkout__input" type="text" value={this.state.form.shipping.city} name="city" placeholder="Enter your city" required />

        <label className="checkout__label" htmlFor="postalZipCode">Postal/Zip code</label>
        <input className="checkout__input" type="text" value={this.state.form.shipping.postalZipCode} name="postalZipCode" placeholder="Enter your postal/zip code" required />

      <h4 className="checkout__subheading">Payment information</h4>

        <label className="checkout__label" htmlFor="cardNum">Credit card number</label>
        <input className="checkout__input" type="text" name="cardNum" value={this.state.form.payment.cardNum} placeholder="Enter your card number" />

        <label className="checkout__label" htmlFor="expMonth">Expiry month</label>
        <input className="checkout__input" type="text" name="expMonth" value={this.state.form.payment.expMonth} placeholder="Card expiry month" />

        <label className="checkout__label" htmlFor="expYear">Expiry year</label>
        <input className="checkout__input" type="text" name="expYear" value={this.state.form.payment.expYear} placeholder="Card expiry year" />

        <label className="checkout__label" htmlFor="ccv">CCV</label>
        <input className="checkout__input" type="text" name="ccv" value={this.state.form.payment.ccv} placeholder="CCV (3 digits)" />

      <button classNamea="checkout__btn-confirm">Confirm order</button>
    </form>
  );
};
```

The fields above contain all the customer details and payments inputs you will need to collect from the customer. The
shipping method data is also required in order to ship the items to the customer. Chec and Commerce.js has verbose
shipment and fulfillment methods to handle this process. In the [Chec Dashboard](https://dashboard.chec.io/), worldwide
shipping zones can be added in Settings > Shipping and then enabled at the product level. For this demo merchant
account, the international shipping for each product is enabled. In the next section, Commerce.js
checkout helper functions will be touched on and these functions will: 
-  Easily fetch a full list of countries, states, provinces, and shipping options to populate the form fields for
   fulfillment data collection
-  Get the live object and update it with any data changes from the form fields

