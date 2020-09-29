import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CartItem from './CartItem';

class Cart extends Component {
    constructor(props) {
        super(props);

        this.handleEmptyCart = this.handleEmptyCart.bind(this);
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