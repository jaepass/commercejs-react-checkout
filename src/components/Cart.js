import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CartItem from './CartItem';
import { Link } from "react-router-dom";

class Cart extends Component {
    constructor(props) {
        super(props);

        this.handleEmptyCart = this.handleEmptyCart.bind(this);
    }

    handleEmptyCart() {
        this.props.onEmptyCart();
    }

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
                {...this.props}
                className="cart__inner"
              />
            ))}
            <div className="cart__total">
              <p className="cart__total-title">Subtotal:</p>
              <p className="cart__total-price">{cart.subtotal.formatted_with_symbol}</p>
            </div>
            <div className="cart__footer">
              <button className="cart__btn-empty" onClick={this.handleEmptyCart}>Empty cart</button>
              <Link
                className="cart__btn-checkout"
                to="/checkout"
              >
                Checkout
              </Link>
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

Cart.propTypes = {
  cart: PropTypes.object,
  onUpdateCartQty: () => {},
  onRemoveFromCart: () => {},
  onEmptyCart: () => {},
  handleUpdateCartQty: PropTypes.func,
  history: PropTypes.object
};
