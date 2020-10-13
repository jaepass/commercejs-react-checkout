
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

library.add(faArrowLeft);

class Confirmation extends Component {
    render() {
        const { order, onBackToHome } = this.props;

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
                    onClick={onBackToHome}
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
    }
}

export default Confirmation;

Confirmation.propTypes = {
    order: PropTypes.object,
    onBackToHome: PropTypes.func,
};
