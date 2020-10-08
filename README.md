# Commerce.js React Checkout

This is a guide for adding checkout order capture functionality to a React application using Commerce.js. This is a
continuation from the previous guide on implementing cart functionality.

[See live demo](https://commercejs-react-checkout.netlify.app/)

## Overview

In this guide you will learn how to create a checkout page to convert cart items into an order, as well and add a
confirmation page to display a successful order message. Below outlines what this guide will achieve:

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

- The purpose of this guide is to focus on the Commerce.js checkout integration, using React to build the
  application. We will therefore not be covering styling details
- We will not be going over any Font Awesome usage
- We will not be going over any UI details that do not pertain much to Commerce.js methods


## Checkout

### 1. Set up routing

For a fully functional SPA (single page application) to scale correctly, you will need to add routing so customers can navigate between cart and checkout pages easily. Commerce.js applications support incredible levels of flexibility when it comes to the checkout and creating unique purchasing flows (routing). 

It's now time to jump back into where you left off from the previous cart guide and add [react-router-dom](https://reactrouter.com/web/guides), a routing library for React web applications, to your project. You will only need to install `react-router-dom` and not `react-router`, which is for React Native. Install the routing library by running the following command:

```bash
yarn add react-router-dom
# OR
npm i react-router-dom
```

After installing, make sure the router component is rendered at the root of your element hierarchy so you
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

Now that you've added routing to serve your whole application, add page components that you'll be
creating in the next section to the [Route Matchers](https://reactrouter.com/web/guides/primary-components) components
`<Route>` and `<Switch>` in `App.js`.

First, import the Route Matchers components `Route` and `Switch` from `react-router-dom`.

```jsx
// App.js
import { Switch, Route } from 'react-router-dom'
```

Next, in your render function, wrap your `<Cart>` and `<Products>` components in a `<Route>` element.

```jsx
// App.je
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

Summarizing the above code block - the `<Route>` includes the attributes:
- `path`'s value points to the path you want to route to.
- `render` outputs the components included in the view page indicated at the `path` value. You can optionally pass
  `props` to the render attribute.
- `exact` attribute ensures the `<Route path>` matches the entire URL.

Now that you've set the initial route component, include a `<Checkout>` component which you will get to creating next.

```jsx
// App.js
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
Pass `{...props}` and `cart={cart}` to ensure you have access to them in the checkout component. You will create this
component in the upcoming section. This is all the routing setup you will need for now until the remaining view
components are added later in the guide.

Lastly, the checkout page will need to be pushed into view from the cart checkout button created in the previous cart
guide. Go into `Cart.js` to import the `Link` component, a navigation component, and replace the checkout `<button>`
element with a `<Link>` component.

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

Now, if you click the link, you should be routed to a blank page with the URL ending in `/checkout`.

### 2. Generate token in the checkout component

In step 1, you created the appropriate route components to navigate to a checkout page. You will now create that
view page to render when the router points to the `/checkout` path. 

First, create a new folder `src/pages` and a `Checkout.js` page component. This page component is going to get
real hefty quite fast, but it will be broken it down into chunks throughout the rest of this guide.

The [Checkout resource](https://commercejs.com/docs/sdk/checkout) in Commerce.js helps to handle one of the most complex moving parts of an eCommerce application. The Checkout endpoint comes with the core `commerce.checkout.generateToken()` and `commerce.checkout.capture()` methods along with [Checkout helpers](https://commercejs.com/docs/sdk/concepts#checkout-helpers) - additional helper functions for a seamless purchasing flow which will be covered later on.

In the `Checkout.js` page component, you'll start by initializing all the data required in this component to
build the checkout page and form. 

Commerce.js provides a powerful method
[`commerce.checkout.generateToken()`](https://commercejs.com/docs/sdk/checkout#generate-token) to capture all the data
needed from the cart and initiate the checkout process simply by providing a cart ID, a product ID, or a product's
permalink as an argument. You'll use a cart ID since we've already built the cart.

First, create a class component then initialize a `checkoutToken` in the constructor's state.

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
  if (cart.line_items.length) {
    commerce.checkout.generateToken(cart.id, { type: 'cart' })
      .then((token) => {
        this.setState({ checkoutToken: token });
    }).catch((error) => {
      console.log('There was an error in generating a token', error);
    });
  }
}
```

The `commerce.checkout.generateToken()` method takes in your cart ID and the identifier type `cart`. The type property is an
optional parameter you can pass in as an identifier, in this case `cart` is the type associated to `this.cart.id`. First
check that `line_items` in `cart` exists with an `if` statement before inserting the `generateToken()` method. The
returned `token` object will be stored in the `checkoutToken` state you created above after a successful request.

To call this function, include it in the `componentDidMount` lifecyle hook to generate a token when the component
mounts.

```jsx
componentDidMount() {
  this.generateCheckoutToken();
}
```

When you click the checkout button from the cart page, you will be routed to `/checkout` and the
`generateCheckoutToken()` function will run. Upon a successful request to generate the checkout token, you should
receive an abbreviated response like the below JSON data:

```json
{
  "id": "chkt_J5aYJ8zBG7dM95",
  "cart_id": "cart_ywMy2OE8zO7Dbw",
  "created": 1600411250,
  "expires": 1601016050,
  "analytics": {
    "google": {
      "settings": {
        "tracking_id": null,
        "linked_domains": null
      }
    }
  },
  "line_items": [
    {
      "id": "item_7RyWOwmK5nEa2V",
      "product_id": "prod_NqKE50BR4wdgBL",
      "name": "Kettle",
      "image": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png",
      "sku": null,
      "description": "<p>Black stove-top kettle</p>",
      "quantity": 1,
      "price": {
        "raw": 45.5,
        "formatted": "45.50",
        "formatted_with_symbol": "$45.50",
        "formatted_with_code": "45.50 USD"
      },
      "subtotal": {
        "raw": 45.5,
        "formatted": "45.50",
        "formatted_with_symbol": "$45.50",
        "formatted_with_code": "45.50 USD"
      },
      "variants": [],
      "conditionals": {
        "is_active": true,
        "is_free": false,
        "is_tax_exempt": false,
        "is_pay_what_you_want": false,
        "is_quantity_limited": false,
        "is_sold_out": false,
        "has_digital_delivery": false,
        "has_physical_delivery": false,
        "has_images": true,
        "has_video": false,
        "has_rich_embed": false,
        "collects_fullname": false,
        "collects_shipping_address": false,
        "collects_billing_address": false,
        "collects_extrafields": false
      },
    }
  ],
  "shipping_methods": [],
  "live": {
    "merchant_id": 18462,
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "line_items": [
      {
        "id": "item_7RyWOwmK5nEa2V",
        "product_id": "prod_NqKE50BR4wdgBL",
        "product_name": "Kettle",
        "type": "standard",
        "sku": null,
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
        "variants": [],
        "tax": {
          "is_taxable": false,
          "taxable_amount": null,
          "amount": null,
          "breakdown": null
        }
      },
      {
        "id": "item_1ypbroE658n4ea",
        "product_id": "prod_kpnNwAMNZwmXB3",
        "product_name": "Book",
        "type": "standard",
        "sku": null,
        "quantity": 1,
        "price": {
          "raw": 13.5,
          "formatted": "13.50",
          "formatted_with_symbol": "$13.50",
          "formatted_with_code": "13.50 USD"
        },
        "line_total": {
          "raw": 13.5,
          "formatted": "13.50",
          "formatted_with_symbol": "$13.50",
          "formatted_with_code": "13.50 USD"
        },
        "variants": [],
        "tax": {
          "is_taxable": false,
          "taxable_amount": null,
          "amount": null,
          "breakdown": null
        }
      }
    ],
    "subtotal": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
    },
    "discount": [],
    "shipping": {
      "available_options": [],
      "price": {
        "raw": 0,
        "formatted": "0.00",
        "formatted_with_symbol": "$0.00",
        "formatted_with_code": "0.00 USD"
      }
    },
    "tax": {
      "amount": {
        "raw": 0,
        "formatted": "0.00",
        "formatted_with_symbol": "$0.00",
        "formatted_with_code": "0.00 USD"
      }
    },
    "total": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
    },
    "total_with_tax": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
    },
    "giftcard": [],
    "total_due": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
    },
    "pay_what_you_want": {
      "enabled": false,
      "minimum": null,
      "customer_set_price": null
    },
    "future_charges": []
  }
}
```

### 3. Build the checkout page

There are four core properties that are required to process an order using Commerce.js - `customer`, `shipping`,
`fulfillment`, and `payment`. Go back to your constructor's state and start to define the fields you need to
capture in the checkout form. The main property objects will all go under a `form` object. You will then bind these
properties to each single field in the render function with the `value` attribute. Note the values filled out in the
data, these are arbitrary values that will prefill the checkout form when it mounts. You'll remove these in a real
application.

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
        payment: {
          cardNum: '4242 4242 4242 4242',
          expMonth: '01',
          expYear: '2023',
          ccv: '123',
          billingPostalZipCode: '94107',
        },
      },
    }
  };
};

export default Checkout;
```

Since this page will contain a lot of markup to render a various components for field inputs and in turn can get quite
bloated, you will want to create a separate render function for the checkout form. This keeps your checkout component
file readable and organized. As mentioned above, bind the data to each of the `value` attributes in the input elements
in the form element below. The inputs will be pre-filled with the state data created above.

```jsx
renderCheckoutForm() {

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

      <button className="checkout__btn-confirm">Confirm order</button>
    </form>
  );
};
```

The fields above contain all the customer details and payment inputs you will need to collect from the customer. The
shipping method data is also required in order to ship the items to the customer. Chec and Commerce.js has verbose
shipment and fulfillment methods to handle this process. In the [Chec Dashboard](https://dashboard.chec.io/settings/shipping), worldwide
shipping zones can be added in Settings > Shipping and then enabled at the product level. For this demo merchant
account, the international shipping for each product is enabled. 

In the next section, Commerce.js checkout helper functions will be covered. These [helper functions](https://commercejs.com/docs/sdk/concepts#checkout-helpers) fetch a full list of countries, states, provinces, and shipping options to populate the form fields for fulfillment data collection.

### 3. Checkout helpers

First, go back to the constructor's state and initialize the empty objects and arrays that you will need to store
the responses from the [checkout helper](https://commercejs.com/docs/sdk/concepts#checkout-helpers) methods. Initialize
a `shippingCountries` object, a `shippingSubdivisions` object and a `shippingOptions` array.

```js
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
  shippingOption: '',
}
```

With a created function `fetchShippingCountries()`, use
[`commerce.services.localeListShipppingCountries()`](https://commercejs.com/docs/sdk/checkout#list-available-shipping-countries)
at `GET v1/services/locale/{checkout_token_id}/countries` to fetch and list all countries in the select options in the
form.

```js
/**
 * Fetches a list of countries available to ship to checkout token
 * https://commercejs.com/docs/sdk/checkout#list-available-shipping-countries
 *
 * @param {string} checkoutTokenId
 */
fetchShippingCountries(checkoutTokenId) {
  commerce.services.localeListShippingCountries(checkoutTokenId).then((countries) => {
    this.setState({ 
      shippingCountries: countries.countries,
    })
  }).catch((error) => {
    console.log('There was an error fetching a list of shipping countries', error);
  });
}
```

The response will be stored in the `shippingCountries` object you initialized earlier in the constructor. You will then
be able to use this countries object to iterate and display a list of countries in a `select` element, which you will be
adding later. The `fetchSubdivisions()` function below will walk through the same pattern as well.

A country code argument is required to make a request with
[`commerce.services.localeListSubdivisions()`](https://commercejs.com/docs/sdk/checkout#list-all-subdivisions-for-a-country)
to `GET v1/services/locale/{country_code}/subdivisions` to get a list of all subdivisions for that particular country.

```jsx
/**
 * Fetches the subdivisions (provinces/states) in a country which
 * can be shipped to for the current checkout
 * https://commercejs.com/docs/sdk/checkout#list-subdivisions
 *
 * @param {string} countryCode
 */
fetchShippingSubdivisions(checkoutTokenId, countryCode) {
  commerce.services.localeListSubdivisions(checkoutTokenId, countryCode).then((subdivisions) => {
      this.setState({
        shippingSubdivisions: subdivisions.subdivisions,
      })
  }).catch((error) => {
      console.log('There was an error fetching the subdivisions', error);
  });
},
```

With a successful request, the response will be stored in the `this.state.shippingSubdivions` array and will be used to
iterate and output a `select` element in your template later on.

For your next checkout helper function, fetch the current shipping options available in your merchant account. This
function will fetch all the shipping options that were registered in the Chec Dashboard and are applicable to the products in
your cart using the
[`commerce.checkout.getShippingOptions()`](https://commercejs.com/docs/sdk/checkout#get-shipping-methods) method. This
function takes in two required parameters - the `checkoutTokenId`, the country code for the provide `country` in our
data, and the `region` is optional.

```jsx
/**
 * Fetches the available shipping methods for the current checkout
 * https://commercejs.com/docs/sdk/checkout#get-shipping-methods
 *
 * @param {string} checkoutTokenId
 * @param {string} country
 * @param {string} stateProvince
 */
fetchShippingOptions(checkoutTokenId, country, stateProvince = null) {
  commerce.checkout.getShippingOptions(checkoutTokenId,
    { 
      country: country,
      region: stateProvince
    }).then((options) => {
      const shippingOption = options[0] || null;
      this.setState({
        shippingOptions: options,
        shippingOption: shippingOption,
      })
    }).catch((error) => {
      console.log('There was an error fetching the shipping methods', error);
  });
}
```

When the promise resolves, the response will be stored into `this.state.shippingOptions` which you can then use to
render a list of shipping options in your template. Note that the `shippingOption` is set to the first index option in
the array to have an option in the dropdown be displayed.

Alright, that wraps up all the checkout helper functions you'll want to create for the checkout page. Now it's time to
execute and hook up the responses to your render function!

Start by chaining and calling the `fetchShippingCountries()` in the `generateCheckoutToken` function for ease of
execution.

```js
/**
 *  Generates a checkout token
 *  https://commercejs.com/docs/sdk/checkout#generate-token
 */
generateCheckoutToken() {
  const { cart } = this.props;
  commerce.checkout.generateToken(cart.id, { type: 'cart' })
    .then((token) => this.setState({ checkoutToken: token }))
    .then(() => this.fetchShippingCountries(this.state.checkoutToken.id))
    .catch((error) => {
      console.log('There was an error in generating a token', error);
    });
}
```

Next, check that `this.state.form.shipping.country` exists then call the `fetchSubdivisions()` function when the
component mounts. This ensures that your data is ready to be used when rendering your select options in your render
function.

```js
componentDidMount() {
  this.generateCheckoutToken();
  if (this.state.form.shipping.country) {
    this.fetchSubdivisions(this.state.form.shipping.country);
  }
}
```

In the same vein, you'll need to call the `fetchShippingOptions()` function to display the list of shipping options
available. Add `this.fetchShippingOptions(this.state.checkoutToken.id, this.state.form.shipping.country,
this.state.form.shipping.stateProvince)` into a lifecycle hook that checks whether the shipping country state has
changed.

```js
componentDidUpdate(prevProps, prevState) {
  if (this.state.form.shipping.country !== prevState.form.shipping.country) {
    this.fetchShippingOptions(this.state.checkoutToken.id, this.state.form.shipping.country, this.state.form.shipping.stateProvince);
  }
}
```

You will now need to bind all the data responses to the shipping form fields. In the shipping section of the JSX render
you created earlier on, place all the markup underneath the **Postal/Zip code** input field:

```jsx
<label className="checkout__label" htmlFor="country">Country</label>
<select 
  value={this.state.form.shipping.country}
  name="country"
  onChange={this.handleFormChanges}
  className="checkout__select"
>
  <option value="" disabled>Country</option>
  {
    Object.keys(shippingCountries).map((index) => {
      return (
        <option value={index} key={index}>{shippingCountries[index]}</option>
      )
    })
  }
</select>

<label className="checkout__label" htmlFor="stateProvince">State/province</label>
<select 
  value={this.state.form.shipping.stateProvince}
  name="stateProvince"
  onChange={this.handleFormChanges}
  className="checkout__select"
>
  <option className="checkout__option" value="" disabled>State/province</option>
  {
    Object.keys(shippingSubdivisions).map((index) => {
      return (
        <option value={index} key={index}>{shippingSubdivisions[index]}</option>
      )
    })
  }
</select>

<label className="checkout__label" htmlFor="shippingOption">Shipping method</label>
<select
  value={this.state.shippingOption.id}
  name="shippingOption"
  onChange={this.handleFormChanges}
  className="checkout__select"
>
    <option className="checkout__select-option" value="" disabled>Select a shipping method</option>
    {
    shippingOptions.map((method, index) => {
      return (
        <option className="checkout__select-option" value={method.id} key={index}>{`${method.description} - $${method.price.formatted_with_code}` }</option>
      )
    })
  }
</select>
```
The three fields you just added: 
- Binds `this.state.form.shipping.country` as the selected country and loops through the `shippingCountries` array
  to render as options
- Binds `this.state.form.shipping.stateProvince` as the selected state/province and iterates through the
  `shippingSubivisions` object to display the available list of countries
- Binds `this.state.shippingOption` and loops through the `shippingOptions` array to render as options in the
  **Shipping method** field.

Once all the data is bound to the field you are then able to collect the necessary data to convert the checkout into an
order object.

### 4. Capture order

With all the data collected, you now need to associate it to each of the order properties in an appropriate data
structure so you can confirm the order.

Create a `handleCaptureCheckout()` handler function and structure your returned data. Have a look at the [expected
structure here](https://commercejs.com/docs/sdk/checkout#capture-order) to send an order request.

```js
handleCaptureCheckout(e) {
  e.preventDefault();
  const orderData = {
    line_items: this.state.checkoutToken.live.line_items,
    customer: {
      firstname: this.state.form.customer.firstName,
      lastname: this.state.form.customer.lastName,
      email: this.state.form.customer.email
    },
    shipping: {
      name: this.state.form.shipping.name,
      street: this.state.form.shipping.street,
      town_city: this.state.form.shipping.city,
      county_state: this.state.form.shipping.stateProvince,
      postal_zip_code: this.state.form.shipping.postalZipCode,
      country: this.state.form.shipping.country,
    },
    fulfillment: {
      shipping_method: this.state..shippingOption
    },
    payment: {
      gateway: "test_gateway",
      card: {
        number: this.state.form.payment.cardNum,
        expiry_month: this.state.form.payment.expMonth,
        expiry_year: this.state.form.payment.expYear,
        cvc: this.state.form.payment.ccv,
        postal_zip_code: this.state.form.payment.billingPostalZipCode
      }
    }
  };
  this.props.onCaptureCheckout(this.state.checkoutToken.id, orderData);
};
```

Follow the exact structure of the data you intend to send and attach a callback function `onCaptureCheckout` to the
handler and pass the order data object along with the required `checkoutToken.id`.

You need a button to handle the clicking of order confirmation, let's add that right now as the last element before the
closing `</form>` tag:

```jsx
<button onClick={this.handleCaptureCheckout} className="checkout__btn-confirm">Confirm order</button>
```

Go back to your `App.js` to initialize an `order` data as an empty object where you store your returned order object.

```js
this.state = {
  merchant: {},
  products: [],
  cart: {},
  isCartVisible: false,
  order: {},
};
```

Before creating an event handler to deal with your order capture, use another Commerce.js method called
[`commerce.checkout.refreshCart()`](https://commercejs.com/docs/sdk/cart#refresh-cart). When you call this function, it
will refresh the cart in your state/session when the order is confirmed.

```js
/**
 * Refreshes to a new cart
 * https://commercejs.com/docs/sdk/cart#refresh-cart
 */
refreshCart() {
  commerce.cart.refresh().then((newCart) => {
    this.setState({ 
      cart: newCart,
    });
  }).catch((error) => {
    console.log('There was an error refreshing your cart', error);
  });
};
```

Now create a helper function which will capture your order with the method
[`commerce.checkout.capture()`](https://commercejs.com/docs/sdk/checkout#capture-order). It takes in the
`checkoutTokenId` and the `newOrder` parameters. Upon the promise resolution, refresh the cart, store the `order` into
the `this.order` property, and lastly use the router to push to a `confirmation` page which will be created in the last
step.

```js
/**
 * Captures the checkout
 * https://commercejs.com/docs/sdk/checkout#capture-order
 *
 * @param {string} checkoutTokenId The ID of the checkout token
 * @param {object} newOrder The new order object data
 */
handleCaptureCheckout(checkoutTokenId, newOrder) {
  commerce.checkout.capture(checkoutTokenId, newOrder).then((order) => {
    // Save the order into state
    this.setState({
      order,
    });
    // Store the order in session storage so we can show it again if the
    // user refreshes the page!
    window.sessionStorage.setItem('order_receipt', JSON.stringify(order));   
    // Clear the cart
    this.refreshCart();
    // Send the user to the receipt 
    return props.history.push('/confirmation');
  }).catch((error) => {
    console.log('There was an error confirming your order', error);
  });
};
```
Now make sure you update and bind the necessary props and event handlers to a `<Route>` component passing in the
`<Checkout>` component in the render:

```jsx
<Route
  path="/checkout"
  exact
  render={(props) => {
    return (
      <Checkout
        {...props}
        cart={cart}
        onCaptureCheckout={this.handleCaptureCheckout}
      />
    );
  }}
/>
```

Lastly, create a simple confirmation view to display a successful order page.

### 5. Order confirmation

Under `src/pages`, create a new page component and name it `Confirmation.js`. Define an order prop for the parent
component `App.js` to pass the order object down. Next, create your render function to output a simple UI for the
confirmation screen.

```js
class Confirmation extends Component {

  render() {
    const { order } = this.props;

    return (
      <div className="confirmation">
        <div className="confirmation__wrapper">
        <div className="confirmation__wrapper-message">
          <h4>Thank you for your purchase, {order.customer.firstname} {order.customer.lastname}!</h4>
          <p className="confirmation__wrapper-reference">
            <span>Order ref:</span> {order.customer_reference}
          </p>
        </div>
        <Link
          className="confirmation__wrapper-back"
          type="button"
          to="/"
        >
          <FontAwesomeIcon
              size="1x"
              icon="arrow-left"
              color="#292B83"
          />
          <span>Back to home</span>
        </Link>
        </div>
      </div>
    );
  };
};

export default Confirmation;
```
The JSX will render a message containing the customer's name and an order reference.

In your `App.js` again, attach your order prop to your `<Route>` `<Checkout>` component instance:

```jsx
<Route
  path="/confirmation"
  exact
  render={(props) => {
    if (!this.state.order) {
      return props.history.push('/');
    }
    return (
      <Confirmation
        {...props}
        order={order}
      />
    )
  }}
/>
```

## That's it!

You have now completed the full series of the Commerce.js and React demo store guides! You can find the full finished
code in [GitHub here](https://github.com/jaepass/commercejs-react-checkout)!
