import { request } from './api.mjs';
let scriptPromise;
export function loadPaymentScript(){
  if(window.Razorpay)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.onload=()=>window.Razorpay?resolve():reject(new Error('Secure checkout is unavailable.'));script.onerror=()=>{scriptPromise=null;script.remove();reject(new Error('Secure checkout could not be loaded. Please try again.'));};document.head.appendChild(script);});
  return scriptPromise;
}
export async function payForCart(details,email){
  await loadPaymentScript();
  const order=await request('/orders/checkout/',{method:'POST',body:details});
  const payment=order.payment||order;
  if(!order.order_id||!payment.key_id||!payment.razorpay_order_id||!(Number(payment.amount)>0))throw new Error('The server returned incomplete payment details.');
  return new Promise((resolve,reject)=>{
    let verifying=false, settled=false;
    const complete=(error,value)=>{if(settled)return;settled=true;error?reject(error):resolve(value);};
    const widget=new window.Razorpay({key:payment.key_id,amount:payment.amount,currency:payment.currency||'INR',order_id:payment.razorpay_order_id,name:'Unimart',description:'Order #'+order.order_id,prefill:{name:details.name,contact:details.phone,email:email||''},handler:async callback=>{verifying=true;try{await request('/orders/payment/verify/',{method:'POST',body:{order_id:order.order_id,razorpay_order_id:callback.razorpay_order_id,razorpay_payment_id:callback.razorpay_payment_id,razorpay_signature:callback.razorpay_signature}});sessionStorage.setItem('marketplace_verified_order',String(order.order_id));complete(null,order.order_id);}catch{complete(new Error('Payment verification is incomplete. Check My orders before attempting payment again.'));}},modal:{ondismiss:()=>{if(!verifying)complete(new Error('Payment was cancelled. Your cart is still available.'));}}});
    widget.on('payment.failed',event=>{widget.close();complete(new Error(event.error?.description||'Payment failed. Please try again.'));});
    try{widget.open();}catch(error){complete(error);}
  });
}
