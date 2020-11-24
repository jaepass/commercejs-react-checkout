## Overview

In this guide you will learn how to create a checkout page to convert cart items into an order, as well and add a
confirmation page to display a successful order message. Below outlines what this guide will achieve:

1. Add page routing to the application
2. Generate a checkout token to capture the order
3. Create a checkout page with a form
4. Create a confirmation page to display an order reference and receipt

[See live demo](https://commercejs-react-checkout.netlify.app/)

[![React checkout](//images.ctfassets.net/u77gi3ejnmxq/2JU8AIMRTKgjq81WhG5iqc/c27ff7a321998fe3d5a66f48e417ad56/Screen_Shot_2020-09-25_at_5.06.05_PM.png)](https://commercejs-vuejs-checkout.netlify.app/)

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

- The purpose of this guide is to focus on the Commerce.js checkout integration, using React to build the application.
  We will therefore not be covering styling details
- We will not be going over any Font Awesome usage
- We will not be going over any UI details that do not pertain much to Commerce.js methods

## Checkout

### 1. Set up routing

For a fully functional SPA (single page application) to scale correctly, you will need to add routing so customers can
navigate between cart and checkout pages easily.

It's now time to jump back into where you left off from the previous cart guide and add
[react-router-dom](https://reactrouter.com/web/guides), a routing library for React web applications, to your project.
You will only need to install `react-router-dom` and not `react-router`, which is for React Native. Install the routing
library by running the following command:

```bash
yarn add react-router-dom
# OR
npm i react-router-dom
```

After installing, make sure the router component is rendered at the root of your element hierarchy so you have access to
the routes you will be setting up. First, go into `src/index.js`, import the
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

Now that you've added routing to serve your whole application, add page components that you'll be creating in the next
section to the [Route Matchers](https://reactrouter.com/web/guides/primary-components) components `<Route>` and
`<Switch>` in `App.js`.

First, import the Route Matchers components `Route` and `Switch` from `react-router-dom`.

```jsx
// App.js
import { Switch, Route } from 'react-router-dom'
```

Next, in your render function, wrap your `<Cart>` and `<Products>` components in a `<Route>` element.

```jsx
// App.js
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

In step 1, you created the appropriate route components to navigate to a checkout page. You will now create that view
page to render when the router points to the `/checkout` path. 

First, create a new folder `src/pages` and a `Checkout.js` page component. This page component is going to get real
hefty quite fast, but it will be broken it down into chunks throughout the rest of this guide.

The [Checkout resource](https://commercejs.com/docs/sdk/checkout) in Commerce.js helps to handle one of the most complex
moving parts of an eCommerce application. The Checkout endpoint comes with the core `commerce.checkout.generateToken()`
and `commerce.checkout.capture()` methods along with [Checkout
helpers](https://commercejs.com/docs/sdk/concepts#checkout-helpers) - additional helper functions for a seamless
purchasing flow which will be covered later on.

In the `Checkout.js` page component, you'll start by initializing all the data required in this component to build the
checkout page and form. 

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

The `commerce.checkout.generateToken()` method takes in your cart ID and the identifier type `cart`. The type property
is an optional parameter you can pass in as an identifier, in this case `cart` is the type associated to `this.cart.id`.
First check that `line_items` in `cart` exists with an `if` statement before inserting the `generateToken()` method. The
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
  "id": "chkt_3l8XzLNjjR9WOl",
  "cart_id": "cart_nldQ8kbzy3QgMw",
  "created": 1602265312,
  "expires": 1602870112,
  "conditionals": {
    "collects_fullname": false,
    "collects_shipping_address": true,
    "collects_billing_address": false,
    "has_physical_delivery": true,
    "has_digital_delivery": true,
    "has_pay_what_you_want": false,
    "has_available_discounts": true,
    "collects_extrafields": false,
    "is_cart_free": false
  },
  "has": {
    "physical_delivery": true,
    "digital_delivery": true,
    "pay_what_you_want": false,
    "available_discounts": true
  },
  "is": {
    "cart_free": false
  },
  "products": [
    {
      "id": "prod_NqKE50BR4wdgBL",
      "created": 1594075580,
      "last_updated": 1600635997,
      "active": true,
      "permalink": "TSUTww",
      "name": "Kettle",
      "description": "<p>Black stove-top kettle</p>",
      "price": {
        "raw": 45.5,
        "formatted": "45.50",
        "formatted_with_symbol": "$45.50",
        "formatted_with_code": "45.50 USD"
      },
      "quantity": 0,
      "media": {
        "type": "image",
        "source": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png"
      },
      "sku": null,
      "sort_order": 0,
      "seo": {
        "title": null,
        "description": null
      },
      "is": {
        "active": true,
        "free": false,
        "tax_exempt": false,
        "pay_what_you_want": false,
        "quantity_limited": false,
        "sold_out": false
      },
      "has": {
        "digital_delivery": false,
        "physical_delivery": true,
        "images": true,
        "video": false,
        "rich_embed": false
      },
      "checkout_url": {
        "checkout": "https://checkout.chec.io/TSUTww?checkout=true",
        "display": "https://checkout.chec.io/TSUTww"
      },
      "extrafields": [],
      "variants": [],
      "categories": [
        {
          "id": "cat_3zkK6oLvVlXn0Q",
          "slug": "office",
          "name": "Home office"
        }
      ],
      "assets": [
        {
          "id": "ast_7ZAMo1Mp7oNJ4x",
          "url": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png",
          "is_image": true,
          "filename": "",
          "file_size": null,
          "file_extension": "",
          "meta": [],
          "created_at": 1594075541,
          "updated_at": 1594075541
        }
      ],
      "related_products": []
    },
  ],
  "gateways": {
    "available": {
      "test_gateway": true,
      "stripe": false,
      "square": false,
      "paypal": false,
      "paymill": false,
      "razorpay": false,
      "manual": false
    },
    "available_count": 1,
    "test_gateway": {
      "type": "card",
      "settings": []
    }
  },
  "shipping_methods": [
    {
      "id": "ship_kpnNwAjO9omXB3",
      "description": "US",
      "price": {
        "raw": 5,
        "formatted": "5.00",
        "formatted_with_symbol": "$5.00",
        "formatted_with_code": "5.00 USD"
      },
      "countries": [
        "US"
      ],
      "regions": {
        "US": [
          "US-AL",
        ]
      }
    },
  ],
  "live": {
    "merchant_id": 18462,
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "subtotal": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
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
    "total_due": {
      "raw": 59,
      "formatted": "59.00",
      "formatted_with_symbol": "$59.00",
      "formatted_with_code": "59.00 USD"
    },
    "line_items": [
      {
        "id": "item_7RyWOwmK5nEa2V",
        "product_id": "prod_NqKE50BR4wdgBL",
        "name": "Kettle",
        "product_name": "Kettle",
        "media": {
          "type": "image",
          "source": "https://cdn.chec.io/merchants/18462/images/676785cedc85f69ab27c42c307af5dec30120ab75f03a9889ab29|u9 1.png"
        },
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
        "type": "standard",
        "tax": {
          "is_taxable": false,
          "taxable_amount": null,
          "amount": null,
          "breakdown": null
        },
        "variants": []
      },
    ],
  },
}
```

### 3. Build the checkout page

There are four core properties that are required to process an order using Commerce.js - `customer`, `shipping`,
`fulfillment`, and `payment`. Go back to your constructor's state and start to define the fields you need to capture in
the checkout form. The main property objects will all go under a `form` object. You will then bind these properties to
each single field in the render function with the `value` attribute. Note the values filled out in the data, these are
arbitrary values that will prefill the checkout form when it mounts. You'll remove these in a real application.

```jsx
class Checkout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checkoutToken: {},
      // Customer details
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'janedoe@email.com',
      // Shipping details
      shippingName: 'Jane Doe',
      shippingStreet: '123 Fake St',
      shippingCity: 'San Francisco',
      shippingStateProvince: 'CA',
      shippingPostalZipCode: '94107',
      shippingCountry: 'US',
      // Payment details
      cardNum: '4242 4242 4242 4242',
      expMonth: '11',
      expYear: '2023',
      ccv: '123',
      billingPostalZipcode: '94107',
      // Shipping and fulfillment data
      shippingCountries: {},
      shippingSubdivisions: {},
      shippingOptions: [],
      shippingOption: '',
    };
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
      <input className="checkout__input" type="text" value={this.state.firstName} name="firstName" placeholder="Enter your first name" required />

      <label className="checkout__label" htmlFor="lastName">Last name</label>
      <input className="checkout__input" type="text" value={this.state.lastName}name="lastName" placeholder="Enter your last name" required />

      <label className="checkout__label" htmlFor="email">Email</label>
      <input className="checkout__input" type="text" value={this.state.email} name="email" placeholder="Enter your email" required />

      <h4 className="checkout__subheading">Shipping details</h4>

      <label className="checkout__label" htmlFor="shippingName">Full name</label>
      <input className="checkout__input" type="text" value={this.state.shippingName} name="shippingName" placeholder="Enter your shipping full name" required />

      <label className="checkout__label" htmlFor="shippingStreet">Street address</label>
      <input className="checkout__input" type="text" value={this.state.shippingStreet} name="shippingStreet" placeholder="Enter your street address" required />

      <label className="checkout__label" htmlFor="shippingCity">City</label>
      <input className="checkout__input" type="text" value={this.state.shippingCity} name="shippingCity" placeholder="Enter your city" required />

      <label className="checkout__label" htmlFor="shippingPostalZipCode">Postal/Zip code</label>
      <input className="checkout__input" type="text" value={this.state.shippingPostalZipCode} name="shippingPostalZipCode" placeholder="Enter your postal/zip code" required />

      <h4 className="checkout__subheading">Payment information</h4>

      <label className="checkout__label" htmlFor="cardNum">Credit card number</label>
      <input className="checkout__input" type="text" name="cardNum" value={this.state.cardNum} placeholder="Enter your card number" />

      <label className="checkout__label" htmlFor="expMonth">Expiry month</label>
      <input className="checkout__input" type="text" name="expMonth" value={this.state.expMonth} placeholder="Card expiry month" />

      <label className="checkout__label" htmlFor="expYear">Expiry year</label>
      <input className="checkout__input" type="text" name="expYear" value={this.state.expYear} placeholder="Card expiry year" />

      <label className="checkout__label" htmlFor="ccv">CCV</label>
      <input className="checkout__input" type="text" name="ccv" value={this.state.ccv} placeholder="CCV (3 digits)" />

      <button className="checkout__btn-confirm">Confirm order</button>
    </form>
  );
};
```

The fields above contain all the customer details and payment inputs you will need to collect from the customer. The
shipping method data is also required in order to ship the items to the customer. Chec and Commerce.js has verbose
shipment and fulfillment methods to handle this process. In the [Chec
Dashboard](https://dashboard.chec.io/settings/shipping), worldwide shipping zones can be added in Settings > Shipping
and then enabled at the product level. For this demo merchant account, US zone shipping for each product is enabled. 

In the next section, Commerce.js checkout helper functions will be covered. These [helper
functions](https://commercejs.com/docs/sdk/concepts#checkout-helpers) fetch a full list of countries, states, provinces,
and shipping options to populate the form fields for fulfillment data collection.

### 3. Checkout helpers

First, go back to the constructor's state and initialize the empty objects and arrays that you will need to store the
responses from the [checkout helper](https://commercejs.com/docs/sdk/concepts#checkout-helpers) methods. Initialize a
`shippingCountries` object, a `shippingSubdivisions` object and a `shippingOptions` array.

```js
this.state = {
  checkoutToken: {},
  // Customer details
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'janedoe@email.com',
  // Shipping details
  shippingName: 'Jane Doe',
  shippingStreet: '123 Fake St',
  shippingCity: 'San Francisco',
  shippingStateProvince: 'CA',
  shippingPostalZipCode: '94107',
  shippingCountry: 'US',
  // Payment details
  cardNum: '4242 4242 4242 4242',
  expMonth: '11',
  expYear: '2023',
  ccv: '123',
  billingPostalZipcode: '94107',
  // Shipping and fulfillment data
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
fetchSubdivisions(countryCode) {
  commerce.services.localeListSubdivisions(countryCode).then((subdivisions) => {
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
function will fetch all the shipping options that were registered in the Chec Dashboard and are applicable to the
products in your cart using the
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
  if (cart.line_items.length) {
    return commerce.checkout.generateToken(cart.id, { type: 'cart' })
      .then((token) => this.setState({ checkoutToken: token }))
      .then(() => this.fetchShippingCountries(this.state.checkoutToken.id))
      .catch((error) => {
        console.log('There was an error in generating a token', error);
      });
  }
}
```

Next, call `generateCheckoutToken()` in `componentDidMount()`.

```js
componentDidMount() {
  this.generateCheckoutToken();
}
```

In the same vein, you'll need to call the `fetchShippingOptions()` function to display the list of shipping options
available. Add `this.fetchShippingOptions(this.state.checkoutToken.id, this.state.shippingCountry)` into a lifecycle hook that checks whether the shipping country
state has changed.

```js
componentDidUpdate(prevProps, prevState) {
  if (this.state.form.shipping.country !== prevState.form.shipping.country) {
    this.fetchShippingOptions(this.state.checkoutToken.id, this.state.shippingCountry);
  }
}
```

You will now need to bind all the data responses to the shipping form fields. In the shipping section of the JSX render
you created earlier on, place all the markup underneath the **Postal/Zip code** input field:

```jsx
<label className="checkout__label" htmlFor="shippingCountry">Country</label>
<select
  value={this.state.shippingCountry}
  name="shippingCountry"
  className="checkout__select"
>
  <option disabled>Country</option>
  {
    Object.keys(shippingCountries).map((index) => {
      return (
        <option value={index} key={index}>{shippingCountries[index]}</option>
      )
    })
  };
</select>

<label className="checkout__label" htmlFor="shippingStateProvince">State/province</label>
<select 
  value={this.state.shippingStateProvince}
  name="shippingStateProvince"
  className="checkout__select"
>
  <option className="checkout__option" disabled>State/province</option>
  {
    Object.keys(shippingSubdivisions).map((index) => {
      return (
        <option value={index} key={index}>{shippingSubdivisions[index]}</option>
      );
    })
  };
</select>

<label className="checkout__label" htmlFor="shippingOption">Shipping method</label>
<select
  value={this.state.shippingOption.id}
  name="shippingOption"
  className="checkout__select"
>
  <option className="checkout__select-option" disabled>Select a shipping method</option>
  {
    shippingOptions.map((method, index) => {
      return (
        <option className="checkout__select-option" value={method.id} key={index}>{`${method.description} - $${method.price.formatted_with_code}` }</option>
      );
    })
  };
</select>
```
The three fields you just added: 
- Binds `this.state.shippingCountry` as the selected country and loops through the `shippingCountries` array to render
  as options
- Binds `this.state.shippingStateProvince` as the selected state/province and iterates through the `shippingSubivisions`
  object to display the available list of countries
- Binds `this.state.shippingOption` and loops through the `shippingOptions` array to render as options in the **Shipping
  method** field.

Currently the prepopulated data defined in the state earlier will be bound to each of the input but changes to the input
fields have not been handled yet. An `onChange` handler will need to be added to handle necessary form field value
changes. Create a handler function `handleFormChanges()` to update the state with changed input values. The handler will
also need to be bound in the constructor.

```js
handleFormChanges(e) {
  this.setState({
    [e.target.name]: e.target.value,
  });
};
```

```js
this.handleFormChanges = this.handleFormChanges.bind(this)
```

The value prop here is setting the value to the latest state so that you can see the inputted value as it is being
typed. Next, attach the handler to the `onChange` attribute in each of the input fields as well as the shipping
state/province and shipping options select fields.

```jsx
<form className="checkout__form" onChange={this.handleFormChanges}>
  <h4 className="checkout__subheading">Customer information</h4>

  <label className="checkout__label" htmlFor="firstName">First name</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.firstName} name="firstName" placeholder="Enter your first name" required />

  <label className="checkout__label" htmlFor="lastName">Last name</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.lastName}name="lastName" placeholder="Enter your last name" required />

  <label className="checkout__label" htmlFor="email">Email</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.email} name="email" placeholder="Enter your email" required />

  <h4 className="checkout__subheading">Shipping details</h4>

  <label className="checkout__label" htmlFor="shippingName">Full name</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.shippingName} name="shippingName" placeholder="Enter your shipping full name" required />

  <label className="checkout__label" htmlFor="shippingStreet">Street address</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.shippingStreet} name="shippingStreet" placeholder="Enter your street address" required />

  <label className="checkout__label" htmlFor="shippingCity">City</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.shippingCity} name="shippingCity" placeholder="Enter your city" required />

  <label className="checkout__label" htmlFor="shippingPostalZipCode">Postal/Zip code</label>
  <input className="checkout__input" type="text" onChange={this.handleFormChanges} value={this.state.shippingPostalZipCode} name="shippingPostalZipCode" placeholder="Enter your postal/zip code" required />

  <label className="checkout__label" htmlFor="shippingCountry">Country</label>
  <select
    value={this.state.shippingCountry}
    name="shippingCountry"
    className="checkout__select"
  >
    <option disabled>Country</option>
    {
      Object.keys(shippingCountries).map((index) => {
        return (
          <option value={index} key={index}>{shippingCountries[index]}</option>
        );
      })
    };
  </select>

  <label className="checkout__label" htmlFor="shippingStateProvince">State/province</label>
  <select 
    value={this.state.shippingStateProvince}
    name="shippingStateProvince"
    onChange={this.handleFormChanges}
    className="checkout__select"
  >
    <option className="checkout__option" disabled>State/province</option>
    {
      Object.keys(shippingSubdivisions).map((index) => {
        return (
          <option value={index} key={index}>{shippingSubdivisions[index]}</option>
        );
      })
    };
  </select>

  <label className="checkout__label" htmlFor="shippingOption">Shipping method</label>
  <select
    value={this.state.shippingOption.id}
    name="shippingOption"
    onChange={this.handleFormChanges}
    className="checkout__select"
  >
    <option className="checkout__select-option" disabled>Select a shipping method</option>
    {
      shippingOptions.map((method, index) => {
        return (
          <option className="checkout__select-option" value={method.id} key={index}>{`${method.description} - $${method.price.formatted_with_code}` }</option>
        );
      })
    };
  </select>

  <h4 className="checkout__subheading">Payment information</h4>

  <label className="checkout__label" htmlFor="cardNum">Credit card number</label>
  <input className="checkout__input" type="text" name="cardNum" onChange={this.handleFormChanges} value={this.state.cardNum} placeholder="Enter your card number" />

  <label className="checkout__label" htmlFor="expMonth">Expiry month</label>
  <input className="checkout__input" type="text" name="expMonth" onChange={this.handleFormChanges} value={this.state.expMonth} placeholder="Card expiry month" />

  <label className="checkout__label" htmlFor="expYear">Expiry year</label>
  <input className="checkout__input" type="text" name="expYear" onChange={this.handleFormChanges} value={this.state.expYear} placeholder="Card expiry year" />

  <label className="checkout__label" htmlFor="ccv">CCV</label>
  <input className="checkout__input" type="text" name="ccv" onChange={this.handleFormChanges} value={this.state.ccv} placeholder="CCV (3 digits)" />

  <button className="checkout__btn-confirm">Confirm order</button>
</form>
```

For data such as the shipping country and shipping subdivisions, it is necessary to handle the option changes
separately. You will want to re-fetch and populate the select options with a new set of subdivisions according to the
country selected. Since only one zone is enabled in the demo account, create two handlers to handle the shipping
country option change as an example and bind the handler in the constructor. The shipping zones are also enabled at the
subdivisions level, so you also want to handle changes to the subdivisions field.

```js
handleShippingCountryChange(e) {
  const currentValue = e.target.value;
  this.fetchSubdivisions(currentValue);
};

handleSubdivisionChange(e) {
  const currentValue = e.target.value;
  this.fetchShippingOptions(this.state.checkoutToken.id,        this.state.shippingCountry, currentValue)
}
```

Be sure to bind your handlers in the constructor again.

```js
this.handleFormChanges = this.handleFormChanges.bind(this);
this.handleShippingCountryChange = this.handleShippingCountryChange.bind(this);
this.handleSubdivisionChange = this.handleSubdivisionChange.bind(this);
```

Now update your shipping country select and state/province fields by calling the handler in an `onChange` attribute.

```jsx
<select
  value={this.state.shippingCountry}
  name="shippingCountry"
  onChange={this.handleShippingCountryChange}
  className="checkout__select"
>
  <option disabled>Country</option>
  {
    Object.keys(shippingCountries).map((index) => {
      return (
        <option value={index} key={index}>{shippingCountries[index]}</option>
      );
    })
  };
</select>

<select
  value={this.state.shippingStateProvince}
  name="shippingStateProvince"
  onChange={this.handleSubdivisionChange}
  className="checkout__select"
>
  <option className="checkout__option" disabled>State/province</option>
    {
       Object.keys(shippingSubdivisions).map((index) => {
        return (
          <option value={index} key={index}>{shippingSubdivisions[index]}</option>
      );
    })
  };
</select>
```

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
      firstname: this.state.firstName,
      lastname: this.state.lastName,
      email: this.state.email,
    },
    shipping: {
      name: this.state.shippingName,
      street: this.state.shippingStreet,
      town_city: this.state.shippingCity,
      county_state: this.state.shippingStateProvince,
      postal_zip_code: this.state.shippingPostalZipCode,
      country: this.state.shippingCountry,
    },
    fulfillment: {
      shipping_method: this.state.shippingOption.id
    },
    payment: {
      gateway: "test_gateway",
      card: {
        number: this.state.cardNum,
        expiry_month: this.state.expMonth,
        expiry_year: this.state.expYear,
        cvc: this.state.ccv,
        postal_zip_code: this.state.billingPostalZipcode,
      },
    },
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
    // Clear the cart
    this.refreshCart();
    // Send the user to the receipt 
    this.props.history.push('/confirmation');
    // Store the order in session storage so we can show it again if the
    // user refreshes the page!
    window.sessionStorage.setItem('order_receipt', JSON.stringify(order));   
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