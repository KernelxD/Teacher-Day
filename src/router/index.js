import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/wish/:invite",
    name: "wish",
    component: () => import("../views/WishView.vue"), // Lazy loaded
  },
];

const Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default Router;
