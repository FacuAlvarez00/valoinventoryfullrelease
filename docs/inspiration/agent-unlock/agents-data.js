const champs = [
    {
      name: 'Cypher',
      img: 'https://i.imgur.com/YLjJMB4.png',
      locked: false
    },
    {
      name: 'Reyna',
      img: 'https://i.imgur.com/ymr2xIs.png',
      locked: true
    },
    {
      name: 'Brimstone',
      img: 'https://i.imgur.com/F95AI8o.png',
      locked: false
    },
    {
      name: 'Sova',
      img: 'https://i.imgur.com/Nb4UaAf.png',
      locked: false
    },
    {
      name: 'Cypher',
      img: 'https://i.imgur.com/YLjJMB4.png',
      locked: false
    },
    {
      name: 'Reyna',
      img: 'https://i.imgur.com/ymr2xIs.png',
      locked: false
    },
    {
      name: 'Brimstone',
      img: 'https://i.imgur.com/F95AI8o.png',
      locked: false
    },
    {
      name: 'Sova',
      img: 'https://i.imgur.com/Nb4UaAf.png',
      locked: false
    },
    {
      name: 'Cypher',
      img: 'https://i.imgur.com/YLjJMB4.png',
      locked: false
    },
    {
      name: 'Reyna',
      img: 'https://i.imgur.com/ymr2xIs.png',
      locked: false
    },
    {
      name: 'Brimstone',
      img: 'https://i.imgur.com/F95AI8o.png',
      locked: false
    },
    {
      name: 'Sova',
      img: 'https://i.imgur.com/Nb4UaAf.png',
      locked: false
    },
    {
      name: 'Cypher',
      img: 'https://i.imgur.com/YLjJMB4.png',
      locked: false
    },
    {
      name: 'Reyna',
      img: 'https://i.imgur.com/ymr2xIs.png',
      locked: false
    }
  ];
        
  const selectableChamps = document.querySelector('.app__right-zone');
  
  champs.forEach(champ => {
    const champTemplate = document.createElement('div');
    champTemplate.innerHTML = `<div class="pickeable-champ ${champ.locked && 'pickeable-champ--locked'}">
        <div class="pickeable-champ__background">
          <img src="${champ.img}" alt="" class="pickeable-champ__img">
          <div class="pickeable-champ__gradient-mask"></div>
          <div class="pickeable-champ__name">
            ${champ.name}
          </div>
        </div>
      </div>`;
    selectableChamps.append(champTemplate);
  })