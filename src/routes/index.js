import express from "express";
import config from "../config";
import middleware from "../middleware";
import initializeDb from "../config/db";
import user from "../controller/user";
import subcategory from "../controller/subCategory";
import product from "../controller/product";
import order from "../controller/order";
import category from "../controller/category";
import group from "../controller/groups";
import payment from "../controller/payments";

let router = express();

initializeDb(db => {
  //internal middleware
  router.use(middleware({ config, db }));
  // api routes v1 (/v1)
  router.use('/user', user({ config, db }));
  router.use('/subcategory', subcategory({ config, db }));
  router.use('/product', product({ config, db }));
  router.use('/order', order({ config, db }));
  router.use('/category', category({ config, db }));
  router.use('/group', group({ config, db }));
  router.use('/payment', payment({ config, db }));
});

export default router;
