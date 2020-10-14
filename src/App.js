import React, { Component } from 'react';
import { commerce } from './lib/Commerce';
import './styles/scss/styles.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faShoppingBag, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Switch, Route } from 'react-router-dom';
import PropTypes from 'prop-types';

import Hero from './components/Hero';
import ProductsList from './components/ProductsList';
import Cart from './components/Cart';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';

library.add(faShoppingBag, faTimes)

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      merchant: {},
      products: [],
      cart: {},
      isCartVisible: false,
      order: this.loadOrderFromLocalStorage() ?? {},
    }

    this.handleAddToCart = this.handleAddToCart.bind(this);
    this.handleUpdateCartQty = this.handleUpdateCartQty.bind(this);
    this.handleRemoveFromCart = this.handleRemoveFromCart.bind(this);
    this.handleEmptyCart = this.handleEmptyCart.bind(this);
    this.toggleCart = this.toggleCart.bind(this);
    this.handleCaptureCheckout = this.handleCaptureCheckout.bind(this);
    this.refreshCart = this.refreshCart.bind(this);
  }

  componentDidMount() {
    this.fetchMerchantDetails();
    this.fetchProducts();
    this.fetchCart();
    this.loadOrderFromLocalStorage();
  }

  /**
   * Fetch a saved order receipt from local storage so we can show the confirmation page
   * again between page refreshes.
   */
  loadOrderFromLocalStorage() {
    if (window.localStorage.getItem('order_receipt')) {
      return JSON.parse(window.localStorage.getItem('order_receipt'));
    }
  }

  /**
   * Show hide cart in nav
   */
  toggleCart() {
    const { isCartVisible } = this.state;
    this.setState({
      isCartVisible: !isCartVisible,
    });
  }

  /**
   * Fetch merchant details
   * https://commercejs.com/docs/sdk/full-sdk-reference#merchants
   */
  fetchMerchantDetails() {
    commerce.merchants.about().then((merchant) => {
      this.setState({ merchant: merchant });
    }).catch((error) => {
      console.log('There was an error fetch the merchant details', error)
    });
  }

  /**
   * Fetch products data from Chec and stores in the products data object.
   * https://commercejs.com/docs/sdk/products
   */
  fetchProducts() {
    commerce.products.list().then((products) => {
      this.setState({ products: products.data });
    }).catch((error) => {
      console.log('There was an error fetching the products', error);
    });
  }

  /**
   * Retrieve the current cart or create one if one does not exist
   * https://commercejs.com/docs/sdk/cart
   */
  fetchCart() {
    commerce.cart.retrieve().then((cart) => {
      this.setState({ cart: cart });
    }).catch((error) => {
      console.error('There was an error fetching the cart', error);
    });
  }

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

  /**
   * Updates line_items in cart
   * https://commercejs.com/docs/sdk/cart/#update-cart
   *
   * @param {string} lineItemId ID of the cart line item being updated
   * @param {number} quantity New line item quantity to update
   */
  handleUpdateCartQty(lineItemId, quantity) {
    commerce.cart.update(lineItemId, { quantity }).then((resp) => {
      this.setState({ cart: resp.cart })
    }).catch((error) => {
      console.log('There was an error updating the cart items', error);
    });
  }

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

  /**
   * Captures the checkout
   * https://commercejs.com/docs/sdk/checkout#capture-order
   *
   * @param {string} checkoutTokenId The ID of the checkout token
   * @param {object} newOrder The new order object data
   */
  handleCaptureCheckout(checkoutTokenId, newOrder) {
    commerce.checkout.capture(checkoutTokenId, newOrder).then((order) => {
      this.setState({
        order: order,
      });
      // Store the order in session storage so we can show it again
      // if the user refreshes the page!
      window.localStorage.setItem('order_receipt', JSON.stringify(order));
      // Clears the cart
      this.refreshCart();
      // Send the user to the receipt
      this.props.history.push('/confirmation');
    }).catch((error) => {
        console.log('There was an error confirming your order', error);
    });
  }

  /**
   * Refreshes to a new cart
   * https://commercejs.com/docs/sdk/cart#refresh-cart
   */
  refreshCart() {
    commerce.cart.refresh().then((newCart) => {
      this.setState({
        cart: newCart,
      })
    }).catch((error) => {
      console.log('There was an error refreshing your cart', error);
    });
  }

  renderCartNav() {
    const { cart, isCartVisible } = this.state;

    return (
      <div className="nav">
        <div className="nav__cart" onClick={this.toggleCart}>
          {!isCartVisible ? (
            <button className="nav__cart-open">
              <FontAwesomeIcon size="2x" icon="shopping-bag" color="#292B83"/>
              {cart !== null ? <span>{cart.total_items}</span> : ''}
            </button>
            ) : (
              <button className="nav__cart-close">
                <FontAwesomeIcon size="1x" icon="times" color="white"/>
              </button>
            )}
        </div>
      </div>
    )
  }

  render() {
    const {
      products,
      merchant,
      cart,
      isCartVisible,
      order
    } = this.state;

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
                  onCaptureCheckout={this.handleCaptureCheckout}
                />
              )
            }}
          />
          <Route
            path="/confirmation"
            exact
            render={(props) => {
              if (!order) {
                return props.history.push('/');
              }
              return (
                <Confirmation
                  {...props}
                  order={order}
                  onBackToHome={() => window.localStorage.removeItem('order_receipt')}
                />
              )
            }}
          />
        </Switch>
      </div>
    );
  }
};

export default App;

App.propTypes = {
  history: PropTypes.object,
};
