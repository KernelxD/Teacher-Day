import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { fullscreen: true }, // the wishing tree fills the screen, so App.vue hides its nav
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
  {
    // The link-preview image. scripts/og-image.mjs screenshots this page; it isn't linked anywhere.
    path: "/og",
    name: "og",
    component: () => import("../views/OgView.vue"),
    meta: { fullscreen: true },
  },
];

const Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default Router;
