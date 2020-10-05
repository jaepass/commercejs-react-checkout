# Commerce.js Vue.js Checkout

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

- The purpose of this guide is to focus on the Commerce.js layer and using React.js to build out the application
  therefore, we will not be going over any styling details
- We will not be going over any Font Awesome usage
- We will not be going over any UI details that do not pertain much to Commerce.js methods

## Checkout

### 1. Set up routing

For fully functional SPAs (single page applications) to scale, you will need to add routing in order to navigate to various view
pages such to a cart or checkout flow. Let's jump right back to where we left off from the previous cart guide and add
[VueRouter](https://router.vuejs.org/), the official routing library for Vue applications, to our project.

```bash
yarn add react-router-dom
# OR
npm i react-router-dom
```

```js
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

  <Route
    path="/"
    render={(props) => {
      return (
        <ProductsList
          {...props}
          products={products}
          onAddToCart={this.handleAddToCart}
        />
      );
    }}
  />
```