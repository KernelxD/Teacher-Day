<script setup>
</script>

<template>
  <nav>
    <ul class="glass-card">
      <li>
        <RouterLink class="nav-link" to="/">
          Home
        </RouterLink>
      </li>
      <li>
        <RouterLink class="nav-link" to="/wish/vtec">
          Wish
        </RouterLink>
      </li>
      <li>
        <RouterLink class="nav-link" to="/teacher/vtec">
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
nav {
  position: sticky;
  top: 1.25rem;
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  pointer-events: none;
}

nav ul {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  list-style: none;
  background: var(--bg-card);
  border: 2px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition), transform var(--transition);
}

nav ul:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.nav-link {
  display: inline-block;
  padding: 0.45rem 1.15rem;
  color: var(--ink);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.92rem;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.nav-link:hover {
  background-color: var(--color-blue);
  border-color: var(--ink);
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.nav-link.router-link-active {
  background-color: var(--color-yellow);
  border-color: var(--ink);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 600px) {
  nav {
    justify-content: center;
    padding: 0 0.5rem;
  }
}
</style>
