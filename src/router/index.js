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
  {
    path: "/teacher/:teacher",
    name: "teacher",
    component: () => import("../views/TeacherView.vue"), // Lazy loaded
  },
];

const Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default Router;
