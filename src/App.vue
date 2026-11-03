<script setup>
</script>

<template>
  <nav>
    <ul>
      <li class="nav-link">
        <RouterLink to="/">
          Home
        </RouterLink>
      </li>
      <li class="nav-link">
        <RouterLink to="/wish/vtec">
          Wish
        </RouterLink>
      </li>
      <li class="nav-link">
        <RouterLink to="/teacher/vtec">
          Teacher
        </RouterLink>
      </li>
    </ul>
  </nav>
  <main>
    <RouterView/>
  </main>
</template>

<style scoped>
ul {
  display: flex;
  justify-content: end;
  gap: 1.5rem;  
  list-style: none;
}

.nav-link {
  font-family: var(--font-main);
  background-color: var(--color-yellow);
  border: solid 1px var(--shadow);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-lg);
}


</style>