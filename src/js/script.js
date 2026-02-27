/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPriceOne: ".cart__total-price strong",
      totalPrice: '.cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: "//localhost:3131",
      products: "products",
      orders: "orders",
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };


  class Product {
    constructor(id, data){
      const thisProduct = this;
      
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);

    }

    getElements(){
      const thisProduct = this;
      
      thisProduct.dom = {};

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = this.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener("click", function(event){
        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(".product.active");

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct != null && activeProduct != thisProduct.element){
          activeProduct.classList.remove("active");
        }

        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle("active");
        
      });
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener("updated", function(){
        thisProduct.processOrder();
      });
    }

    initOrderForm(){
      const thisProduct = this;

      thisProduct.dom.form.addEventListener("submit", function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.dom.formInputs){
        input.addEventListener("change", function(){
          thisProduct.processOrder();
        });
      }

      thisProduct.dom.cartButton.addEventListener("click", function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder(){
      const thisProduct = this;

      // covert form to object structure
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params){
        // determine param value
        const param = thisProduct.data.params[paramId];

        // for every option in this category
        for(let optionId in param.options){
          // determine option value
          const option = param.options[optionId];
          
          const image = thisProduct.dom.imageWrapper.querySelector('.' + paramId + "-" + optionId);

          // check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId] && formData[paramId].includes(optionId)) {
            
            if(image){
              image.classList.add(classNames.menuProduct.imageVisible);
            }

            // check if the option is not default
            if(!option.default) {
              // add option price to price variable
              price += option.price;
              
            }
          } else {

            if(image){
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
            
            // check if the option is default
            if(option.default) {
              // reduce price variable
              price -= option.price;
            }
          }

          
        }
      }

      thisProduct.priceSingle = price;

      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
      
      thisProduct.dom.form.reset();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.amountWidget.value * thisProduct.priceSingle;
      
      productSummary.params = thisProduct.prepareCartProductParams();
      
      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      const params = {};

      // covert form to object structure
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      // for every category (param)...
      for(let paramId in thisProduct.data.params){
        // determine param value
        const param = thisProduct.data.params[paramId];

        params[paramId] = {
          label: param.label,
          options: {}
        }
        // for every option in this category
        for(let optionId in param.options){
          // determine option value
          const option = param.options[optionId];
          
          // check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId] && formData[paramId].includes(optionId)) {

            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      
      const value = parseInt(thisWidget.input.value);
      if(isNaN(value)){
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
      else {
        thisWidget.setValue(thisWidget.input.value);
      }
      
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      
      /* TODO: Add validation */

      if(newValue !== thisWidget.value && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
      }

      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    announce(){
      const thisWidget = this;
      const event = new Event("updated", {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }

    initActions(){
      const thisWidget = this;
      
      thisWidget.input.addEventListener("change", function(){
        thisWidget.setValue(thisWidget.input.value)
      });

      thisWidget.linkDecrease.addEventListener("click", function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1)
      });

      thisWidget.linkIncrease.addEventListener("click", function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1)
      });
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = this.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalPriceOne = thisCart.dom.wrapper.querySelector(select.cart.totalPriceOne);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

      thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener("click",  function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener("updated", function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener("remove", function(event){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener("submit", function(event){
        event.preventDefault();
        if(thisCart.dom.phone.value.length == 9 && thisCart.dom.address.value.length > 2 && thisCart.totalNumber > 0 && !isNaN(thisCart.totalNumber)){
          thisCart.sendOrder();
        }
        else {
          if(thisCart.dom.phone.value.length !== 9){
            alert("Numer telefonu jest nie poprawny");
          }
          if(thisCart.dom.address.value.length <= 2){
            alert("Adress jest nie poprawny");
          }
          if(isNaN(thisCart.totalNumber) || thisCart.totalNumber < 1  ){
            alert("Musisz dodać przynajmniej jeden produkt by złożyć zamówienie");
          }
        }
      });

      thisCart.dom.phone.addEventListener("change", function(){
        if(thisCart.dom.phone.value.length == 9){
          thisCart.dom.phone.classList.remove("error");
        }
        else {
          thisCart.dom.phone.classList.add("error");
        }
      });

      thisCart.dom.address.addEventListener("change", function(){
        if(thisCart.dom.address.value.length > 2){
          thisCart.dom.address.classList.remove("error");
        }
        else {
          thisCart.dom.address.classList.add("error");
        }
      });
    }

    add(menuProduct){
      const thisCart = this;

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);

      /* create element using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      /* add element to cart wrapper */
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.update();
    }

    update(){
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for(const product of thisCart.products){
        thisCart.totalNumber = thisCart.totalNumber + parseInt(product.amount);
        thisCart.subtotalPrice += product.price;
      }

      if(thisCart.totalNumber > 0){
        thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      }
      else {
        thisCart.totalPrice = 0;
        thisCart.dom.deliveryFee.innerHTML = 0;
      }

      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalPriceOne.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    }

    remove(cartProduct){
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);
      
      cartProduct.dom.amountWidget.parentElement.remove();
      thisCart.products.splice(index, 1);
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      const playload = {};

      playload.address = thisCart.dom.address.value;
      playload.phone = thisCart.dom.phone.value;
      playload.totalPrice = thisCart.totalPrice;
      playload.subtotalPrice = thisCart.subtotalPrice;
      
      playload.totalNumber = thisCart.totalNumber;
      playload.deliveryFee = settings.cart.defaultDeliveryFee;
      playload.products = [];

      for(let prod of thisCart.products){
        playload.products.push(prod.getData());
      }
      console.log("playload: ", playload);

      const options ={
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playload),
      }

      fetch(url,options).then(response => {
        if(response.ok){
          alert("Zamówienie wysłane");
        }
        else{
          const error = "Nie można połączyć się z serwerem! Kod błędu: " + response.status;
          alert(error);
        }
      }).catch(error => {
        alert(error);
      });

      for(const product of thisCart.products){
        product.dom.amountWidget.parentElement.remove();
      }
        thisCart.products.splice(0, thisCart.products.length);
        thisCart.update();
        thisCart.dom.address.value = "";
        thisCart.dom.phone.value = "";
    }
  }

  class CartProduct{
    constructor(menuProduct, element){
      const thisCartProduct = this;
      
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name = menuProduct.name;
      
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
      thisCartProduct.dom.amountWidgetInput = thisCartProduct.dom.amountWidget.querySelector(select.all.formInputs);
    }

    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener("updated", function(){
        thisCartProduct.amount = thisCartProduct.dom.amountWidgetInput.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener("click", function(){});
      thisCartProduct.dom.remove.addEventListener("click", function() {
        thisCartProduct.remove();
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent("remove", {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    getData(){
      const thisCartProduct = this;
      const productSummary = {};

      productSummary.id = thisCartProduct.id;
      productSummary.amount = thisCartProduct.amount;
      productSummary.price = thisCartProduct.price;
      
      productSummary.priceSingle = thisCartProduct.priceSingle;
      productSummary.name = thisCartProduct.name;
      productSummary.params = thisCartProduct.params;

      return productSummary;
    }
  }

  const app = {
    initMenu: function() {
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function() {
      const thisApp = this;
      const url = settings.db.url + "/" + settings.db.products;

      

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(prasedResponse){

          /* save prasedResponse as thisApp.data.products */
          thisApp.data.products = prasedResponse;

          /* exectue initMenu method */
          thisApp.initMenu();

        }).catch(erorr=>{
          alert(erorr);
        });
      thisApp.data = {};
    },

    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);

      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      
      thisApp.initCart();
    },
  };

  app.init();
}
