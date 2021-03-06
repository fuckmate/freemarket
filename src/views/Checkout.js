import React from 'react'
import { observer } from 'mobx-react';
import { slugify } from '../util/url'
import uuid from 'uuid/v4'
import StripeCheckout from "react-stripe-checkout"
import Select from '../components/Select.js'
import State from './state'
import './Checkout.css'

import {PUBLIC_KEY} from '../PUBLIC_KEY.js'
// const PUBLIC_KEY = 1234
// console.log('public key: ' + PUBLIC_KEY)

const uspsShippingCost = 10
const upsShippingCost  = 15
const fedexShippingCost= 20
const formfields = ['Name','Street Address','City', 'State/Province','ZIP code / Postal Code', 'Country']

const encodeData=token=>{
  const relevantFieldsFromItem = ['title','quantity','price','options']
  const purchaseInfo    = '\npurchases: ' + State.cart.map((item,i)=>`\n\n#${i+1} :` + relevantFieldsFromItem.map(field=>`\n${field}:${item[field]}`))
  const userDataStrings = Object.keys(State.fields).map(name=>`${name} : ${State.fields[name]}`)
  const cartInfo = `
subtotal : ${State.getTotal()}
total with shipping : ${State.getTotalWithShipping()}
total with tax : ${State.getTotalWithShipping() * 1.16}
date : ${Date()}
  `
  const userData = userDataStrings.join('\n')
  const tokenString = JSON.stringify(token||'',null,3).replace(/[^\w\s:_@.-]/g,'')
  return`
${userData}
${purchaseInfo}
${cartInfo}

stripe payment meta-data:
${tokenString}`
}
const onToken = token => {
  const data = {
    token:token,
    amount : 111,
    idempotency_key:uuid(),
  }
//  console.log(token)
  fetch("/.netlify/functions/purchase", {
    method: "POST",
    body: JSON.stringify(data)
  }).then(response => {
    response.json().then(data => {
      // console.log(data)
      if(data.status=='succeeded'){
        alert(`payment was successful`);
        submit(encodeData(token))
      }
    });
  });
}
const encode = (data) => {
  return Object.keys(data)
      .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
      .join("&");
}
const submit = (data) => {
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encode({ "form-name": "purchase", "data":data })
  })
    .then(() => alert("Success!"))
    .catch(error => alert(error));
};

const Checkout = () =>
  <div className='checkout-container'>
    <p>Please enter your shipping info:</p>
    <form name='purchase'>
      {formfields.map((field,index)=>{
        const slug = slugify(field)
        return(
          <div>
          <input
            key={index}
            placeholder={field}
            name={slug} 
            value={State.getField(slug) || ''} 
            onChange={(e)=>State.setField(e.target.name,e.target.value)}/>
          </div>
      )})}
      <div className='checkout-shipping-dropdown'>
      <Select 
        title='Please Select Shipping :'
        options={[{label:`USPS ($ ${uspsShippingCost})`  ,value:uspsShippingCost},
                  {label:`UPS ($ ${upsShippingCost})`    ,value:upsShippingCost},
                  {label:`FEDEX ($ ${fedexShippingCost})`,value:fedexShippingCost}
                ]}
        onChange={(e)=>{
          State.setShippingCost(e.value);
          encodeData()
        }}
      />
      </div>
    </form>
      <p className="Checkout-Text">{"total with shipping : $" + (State.getTotalWithShipping()).toFixed(2)}</p>
      <p className="Checkout-Text">{"total with taxes    : $" + ((State.getTotalWithShipping())*1.15).toFixed(2)}</p>
    <StripeCheckout token={onToken} stripeKey={PUBLIC_KEY}/>      
  </div>

export default observer(Checkout)