import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { commerce } from '../lib/Commerce';

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
            shippingCountries: {},
            shippingSubdivisions: {},
            shippingOptions: [],
            shippingOption: '',
        }

        this.handleFormChanges = this.handleFormChanges.bind(this); 
        this.handleCaptureCheckout = this.handleCaptureCheckout.bind(this);
    }

    componentDidMount() {
        this.generateCheckoutToken();
        if(this.state.form.shipping.country) {
            this.fetchSubdivisions(this.state.form.shipping.country);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.state.form.shipping.country !== prevState.form.shipping.country) {
            this.fetchShippingOptions(this.state.checkoutToken.id, this.state.form.shipping.country, this.state.form.shipping.stateProvince);
        }
    }

   /**
    *  Generates a checkout token
    *  https://commercejs.com/docs/sdk/checkout#generate-token
    */
    generateCheckoutToken() {
        const { cart } = this.props;
        commerce.checkout.generateToken(cart.id, { type: 'cart' })
        .then((token) => this.setState({ checkoutToken: token }))
        .then(() => this.fetchShippingCountries(this.state.checkoutToken.id))
        .then(() => this.fetchShippingOptions(this.state.checkoutToken.id, this.state.form.shipping.country, this.state.form.shipping.stateProvince))
        .catch((error) => {
            console.log('There was an error in generating a token', error);
        });
    }

    /**
     * Fetches a list of countries available to ship to checkout token
     * https://commercejs.com/docs/sdk/checkout#list-available-shipping-countries
     *
     * @param {string} checkoutTokenId
     */
    fetchShippingCountries(checkoutTokenId) {
        commerce.services.localeListShippingCountries(checkoutTokenId).then((countries) => {
            this.setState({ 
                shippingCountries: countries.countries 
            })
        }).catch((error) => {
            console.log('There was an error fetching a list of shipping countries', error);
        });
    }

    /**
     * Fetches the subdivisions (provinces/states) for a country
     * https://commercejs.com/docs/sdk/checkout#list-all-subdivisions-for-a-country
     *
     * @param {string} countryCode
     */
    fetchSubdivisions(countryCode) {
        commerce.services.localeListSubdivisions(countryCode).then((subdivisions) => {
            this.setState({ 
                shippingSubdivisions: subdivisions.subdivisions
            })
        }).catch((error) => {
            console.log('There was an error fetching the subdivisions', error);
        });
    }

    /**
     * Fetches the available shipping methods for the current checkout
     * https://commercejs.com/docs/sdk/checkout#get-shipping-methods
     *
     * @param {string} checkoutTokenId
     * @param {string} country
     * @param {string} stateProvince
     */
    fetchShippingOptions(checkoutTokenId, country, stateProvince) {
        commerce.checkout.getShippingOptions(checkoutTokenId,
            { 
                country: country,
                region: stateProvince
            }).then((options) => {
                const shippingOption = options[0] || null;
                this.setState({
                    shippingOption: shippingOption,
                    shippingOptions: options
                })
            }).catch((error) => {
                console.log('There was an error fetching the shipping methods', error);
        });
    }

    handleFormChanges(e) {
        this.setState({ value: e.target.value });
    }

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
                shipping_method: this.state.shippingOption.id
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
        this.props.history.push('/confirmation');
    }

    renderCheckoutForm() {
        const { shippingCountries, shippingSubdivisions, shippingOptions } = this.state;

        return (
            <form className="checkout__form" onChange={this.handleFormChanges}>
                <h4 className="checkout__subheading">Customer information</h4>

                    <label className="checkout__label" htmlFor="firstName">First name</label>
                    <input
                        className="checkout__input" type="text" value={this.state.form.customer.firstName} name="firstName" placeholder="Enter your first name" required />

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

                <h4 className="checkout__subheading">Payment information</h4>

                    <label className="checkout__label" htmlFor="cardNum">Credit card number</label>
                    <input className="checkout__input" type="text" name="cardNum" value={this.state.form.payment.cardNum} placeholder="Enter your card number" />

                    <label className="checkout__label" htmlFor="expMonth">Expiry month</label>
                    <input className="checkout__input" type="text" name="expMonth" value={this.state.form.payment.expMonth} placeholder="Card expiry month" />

                    <label className="checkout__label" htmlFor="expYear">Expiry year</label>
                    <input className="checkout__input" type="text" name="expYear" value={this.state.form.payment.expYear} placeholder="Card expiry year" />

                    <label className="checkout__label" htmlFor="ccv">CCV</label>
                    <input className="checkout__input" type="text" name="ccv" value={this.state.form.payment.ccv} placeholder="CCV (3 digits)" />

                <button onClick={this.handleCaptureCheckout} className="checkout__btn-confirm">Confirm order</button>
            </form>
        );
    };

    renderCheckoutSummary() {
        const { cart } = this.props;

        return (
            <>
                <div className="checkout__summary">
                    <h4>Order summary</h4>
                        {cart.line_items.map((lineItem) => (
                            <>
                                <div key={lineItem.id} className="checkout__summary-details">
                                    <img className="checkout__summary-img" src={lineItem.media.source} alt={lineItem.name}/>
                                    <p className="checkout__summary-name">{lineItem.quantity} x {lineItem.name}</p>
                                    <p className="checkout__summary-value">{lineItem.line_total.formatted_with_symbol}</p>
                                    </div>
                            </>
                        ))}
                    <div className="checkout__summary-total">
                        <p className="checkout__summary-price">
                            <span>Subtotal:</span>
                            {cart.subtotal.formatted_with_symbol}
                        </p>
                    </div>
                </div>
            </>
        )
    }

    render() {
        return (
          <div className="checkout">
                <h2 className="checkout__heading">
                    Checkout
                </h2>
                <div className="checkout__wrapper">
                    { this.renderCheckoutForm() }
                    { this.renderCheckoutSummary() }
                </div>
          </div>
        );
    };
};

export default Checkout;

Checkout.propTypes = {
    cart: PropTypes.object,
    history: PropTypes.object,
    onCaptureCheckout: () => {},
};