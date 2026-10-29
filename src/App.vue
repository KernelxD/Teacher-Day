<script setup>
</script>

<template>
  <nav>
    <ul>
      <li>
        <RouterLink to="/">
          Home
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/wish/vtec">
          Wish
        </RouterLink>
      </li>
    </ul>
  </nav>
  <main>
    <RouterView/>
  </main>
</template>