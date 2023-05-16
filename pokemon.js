const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = []

// update pagination buttons
const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty()

  const maxPages = 5;
  const startPage = Math.max(currentPage - 2, 1);
  const endPage = Math.min(startPage + maxPages - 1, numPages);

  // Add the previous button
  if (currentPage > 1) {
    $('#pagination').append(`
      <button class="btn btn-primary rounded-pill px-3 numberedButtons" value="${currentPage - 1}">
        Previous
      </button>
    `);
  }

  // Add the numbered buttons
  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn  ${i === currentPage ? 'btn-secondary rounded-pill px-3' : 'btn-link rounded-pill px-3'} numberedButtons" value="${i}">
        ${i}
      </button>
    `);
  }

  // Add the next button
  if (currentPage < numPages) {
    $('#pagination').append(`
      <button class="btn btn-primary rounded-pill px-3 numberedButtons" value="${currentPage + 1}">
        Next
      </button>
    `);
  }
}

// filter pokemons by selected types
const filterPokemons = async (pokemons) => {
  const typeFilters = Array.from($('.typeFilter:checked')).map((checkbox) => checkbox.value);

  let filtered_pokemons = pokemons;
  if (typeFilters.length > 0) {
    filtered_pokemons = await Promise.all(pokemons.map(async (pokemon) => {
      const res = await axios.get(pokemon.url);
      const types = res.data.types.map((type) => type.type.name);
      if (typeFilters.every((filter) => types.includes(filter))) {
        return pokemon;
      }
      return null;
    }));
    filtered_pokemons = filtered_pokemons.filter((pokemon) => pokemon !== null);
  }
  return filtered_pokemons
}

// paginate pokemons
const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const filtered_pokemons = await filterPokemons(pokemons)
  const selected_pokemons = filtered_pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + PAGE_SIZE - 1, filtered_pokemons.length);
  const totalCount = filtered_pokemons.length;

  // Shows the number of pokemons displayed
  $('#pokeCount').text(`Displaying ${startIndex} - ${endIndex} of ${totalCount} Pokémons`);
  
  // display pokemons
  $('#pokeCards').empty()
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url)
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-success" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `)
  })


};

const setup = async () => {
  // test out poke api using axios here

  $('#pokeCards').empty()
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons)
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE)
  updatePaginationDiv(currentPage, numPages)

  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name)
    // console.log("types: ", types);
    $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
  })

  // add event listener to pagination buttons
  $('body').on('click', ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages)
  })

  // get pokemon types from API
  const responseF = await axios.get('https://pokeapi.co/api/v2/type');
  const types = responseF.data.results;

  // add pokemon types to filter
  types.forEach((type) => {
    $('#typeFilters').append(`
      <div class='checkbox-style'>
      <input class="typeFilter" type="checkbox" value="${type.name}" id="${type.name}">
      <label for="${type.name}">${type.name}</label>
        <div>
      `)
  })

  $('body').on('change', '.typeFilter', async function (e) {
    currentPage = 1;
    paginate(currentPage, PAGE_SIZE, pokemons);

    // update pagination buttons
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);
  });
}

$(document).ready(setup)