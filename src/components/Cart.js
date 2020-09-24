import React, { Component } from 'react';
import { commerce } from '../lib/Commerce';
import PropTypes from 'prop-types';
import CartItem from './CartItem';

class Cart extends Component {
    constructor(props) {
        super(props);

        this.handleUpdateCartQty = this.handleUpdateCartQty.bind(this);
        this.handleEmptyCart = this.handleEmptyCart.bind(this);
    }

    /**
     * Updates line_items in cart
     * https://commercejs.com/docs/sdk/cart/#update-cart
     *
     * @param {string} lineItemId ID of the cart line item being updated
     * @param {number} quantity New line item quantity to update
     */
    handleUpdateCartQty(lineItemId, newQuantity) {
        commerce.cart.update(lineItemId, { newQuantity }).then((resp) => {
        this.setState({ cart: resp.cart })
        }).catch((error) => {
        console.log('There was an error updating the cart items', error);
        });
    }

    handleEmptyCart() {
        this.props.onEmptyCart();
    }

    render() {
        const { cart } = this.props;

        return (
            <div className="cart">
                <h4 className="cart__heading">Your Shopping Cart</h4>
                <>
                    {cart.total_unique_items > 0 ? (
                        <>
                        {cart.line_items.map(lineItem => (
                            <CartItem
                                item={lineItem}
                                key={lineItem.id}
                                {...this.props}
                                className="cart__inner"
                                onUpdateCartQty={this.handleUpdateCartQty}
                            />
                        ))}
                        <div className="cart__total">
                            <p className="cart__total-title">Subtotal:</p>
                            <p className="cart__total-price">{cart.subtotal.formatted_with_symbol}</p>
                        </div>
                        <div className="cart__footer">
                            <button className="cart__btn-empty" onClick={this.handleEmptyCart}>Empty cart</button>
                            <button className="cart__btn-checkout">Checkout</button> 
                        </div>
                        </>
                    ) : (
                    <p className="cart__none">
                       You have no items in your shopping cart, start adding some!
                    </p>
                    )}
                </>
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
    handleUpdateCartQty: PropTypes.func
 };