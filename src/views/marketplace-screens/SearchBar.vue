<template>
<div class="text-center no-wrap main-search--border">
  <b-input-group>
    <template v-slot:append>
      <a href="#"  @click.prevent="doSearch"><b-icon icon="search"/></a>
    </template>
    <template v-slot:prepend v-if="showPrepend">
      <b-dropdown no-caret>
        <!-- Using 'button-content' slot -->
        <template v-slot:button-content>
          <span>Search by</span>
        </template>
        <!--
        <div class="dropdown__whitespace"></div>
        <div class="dropdown__filler"></div>
        <div class="dropdown__items">
          <b-dropdown-item></b-dropdown-item>
          <b-dropdown-item>Application</b-dropdown-item>
          <b-dropdown-item>Artist</b-dropdown-item>
          <b-dropdown-item>Collection</b-dropdown-item>
          <b-dropdown-item>On Auction</b-dropdown-item>
          <b-dropdown-item>Buy Now</b-dropdown-item>
        </div>
        -->
      </b-dropdown>
    </template>
    <b-form-input v-on:keyup.enter="doSearch" v-model="query"  size="sm" class="text-13-300 mr-sm-2" placeholder="Looking for something in particular?"></b-form-input>
  </b-input-group>
</div>
</template>

<script>

export default {
  name: 'SearchBar',
  components: {
  },
  props: ['showPrepend'],
  data () {
    return {
      query: null
    }
  },
  methods: {
    doSearch () {
      this.$emit('set-filter', { query: this.query, filter: 'text-search' })
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
#homepage {
  /* 1ST SECTION STYLE */
  & .title-container h1 {
    margin-bottom: 24px;
  }
  & .title-container h2 {
    margin-bottom: 38px;
  }
  & .homepage__buttons--container .button-primary {
    margin-right: 18px;
  }

  /* MAIN SEARCH BAR */
  & .main-search {
    margin-top: -28.5px;
    z-index: 2;
  }
  & .main-search--border {
    width: 100%;
    max-width: 800px;
  }
  & .input-group {
    background: #FFFFFF;
    border: 1px solid #F5F5F5;
    border-radius: 36px;
    align-items: center;
    height: 57px;
    box-shadow: 0px 3px 6px #00000029;
  }
  & .input-group input {
    font-size: 1.1rem;
    font-weight: 300;
    color: #000;
    height: 26px;
    padding: 0.25rem 25px;
    border-left: 1px solid #E5E5E5;
    border-top: none;
    border-right: none;
    border-bottom: none;
    border-radius: 0 !important;
    z-index: 2;
  }
  & .input-group input:focus {
    box-shadow: none;
  }
  & .main-search .btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 600;
    color: #000;
    text-transform: none;
    background: transparent;
    border: none;
    padding-left: 30px;
    padding-right: 30px;
    z-index: 2;
  }
  & .main-search .btn:focus {
    box-shadow: none;
  }
  & .main-search .btn.dropdown-toggle::after {
    font-size: 1.6rem;
  }

  /* MAIN SEARCH BAR -- DROPDOWN MENU */
  & .input-group .dropdown-menu {
    width: 177px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    position: absolute;
    top: -7px !important;
    left: 0;
    z-index: 1;
  }
}
#marketplace {
  /* 1ST SECTION STYLE */
  & .title-container h1 {
    margin-bottom: 24px;
  }
  & .title-container h2 {
    margin-bottom: 38px;
  }
  & .homepage__buttons--container .button-primary {
    margin-right: 18px;
  }

  /* MAIN SEARCH BAR */
  & .main-search {
    margin-top: -28.5px;
    z-index: 2;
  }
  & .main-search--border {
    width: 100%;
    max-width: 800px;
  }
  & .main-search .btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 600;
    color: #000;
    text-transform: none;
    background: transparent;
    border: none;
    padding-left: 30px;
    padding-right: 30px;
    z-index: 2;
  }
  & .main-search .btn:focus {
    box-shadow: none;
  }
  & .main-search .btn.dropdown-toggle::after {
    font-size: 1.6rem;
  }

  /* MAIN SEARCH BAR -- DROPDOWN MENU */
  & .input-group .dropdown-menu {
    width: 177px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    position: absolute;
    top: -7px !important;
    left: 0;
    z-index: 1;
  }
}
</style>
