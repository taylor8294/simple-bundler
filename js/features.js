ready(() => {

  // data-toggle
  Array.from(document.querySelectorAll('[data-toggle]')).forEach(a => {
    a.addEventListener('click', e => {
      let targets = Array.from(document.querySelectorAll(a.dataset.toggle));
      if (targets && targets.length) {
        targets.forEach(target => {
          let label = document.querySelector(a.dataset.showLabel),
            icon = document.querySelector(a.dataset.showIcon);
          if (!label) label = a.querySelector('span')
          if (!label) label = a;
          if (!icon) icon = a.querySelector('i')
          if (target.classList.contains('hidden')) {
            let labelTxt = a.dataset.shownLabel, shownIcon = a.dataset.shownIcon, hiddenIcon = a.dataset.hiddenIcon;
            target.classList.remove('hidden');
            if (label && labelTxt) label.textContent = labelTxt;
            if (icon && shownIcon) {
              //icon.classList.remove(hiddenIcon);
              //icon.classList.add(shownIcon);
              icon.innerHTML = shownIcon;
            }
          } else {
            let labelTxt = a.dataset.hiddenLabel, shownIcon = a.dataset.shownIcon, hiddenIcon = a.dataset.hiddenIcon;
            target.classList.add('hidden');
            if (label && labelTxt) label.textContent = labelTxt;
            if (icon && hiddenIcon) {
              //icon.classList.remove(shownIcon);
              //icon.classList.add(hiddenIcon);
              icon.innerHTML = hiddenIcon;
            }
          }
        })
      }
    })
  });

  // data-hide
  Array.from(document.querySelectorAll('[data-hide]')).forEach(a => {
    a.addEventListener('click', e => {
      let targets = Array.from(document.querySelectorAll(a.dataset.hide));
      if (targets && targets.length) {
        targets.forEach(target => {
          target.classList.add('hidden');
        })
      }
    });
  });

  // data-click
  Array.from(document.querySelectorAll('[data-click]')).forEach(a => {
    a.addEventListener('click', e => {
      let targets = Array.from(document.querySelectorAll(a.dataset.click));
      if (targets && targets.length) {
        targets.forEach(target => {
          const rect = target.getBoundingClientRect();
          const middleX = rect.left + rect.width / 2;
          const middleY = rect.top + rect.height / 2;
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: middleX, // Middle X coordinate of the element
            clientY: middleY, // Middle Y coordinate of the element
            screenX: window.screenX + middleX, // Middle X coordinate of the screen
            screenY: window.screenY + middleY, // Middle Y coordinate of the screen
            button: 0, // Left mouse button
            shiftKey: false,
            ctrlKey: false,
            altKey: false,
            metaKey: false
          });
          target.dispatchEvent(clickEvent);
        })
      }
    })
  });

  // data-class-group
  Array.from(document.querySelectorAll('[data-class-group]')).forEach(a => {
    a.addEventListener('click', e => {
      let groupName = a.dataset.classGroup,
        onClass = a.dataset.classGroupActive ?? 'active',
        offClass = a.dataset.classGroupInactive ?? '',
        group = Array.from(document.querySelectorAll('[data-class-group="'+groupName+'"]'));
      group.forEach(el => {
        el.classList.remove(onClass);
        el.classList.add(offClass);
      });
      a.classList.remove(offClass);
      a.classList.add(onClass);
    });
  });

  //input[allowedchars]
  Array.from(document.querySelectorAll('input[allowedchars]')).forEach(input => {
    input.addEventListener('beforeinput', function (e) {
      const allowed = e.target.getAttribute('allowedchars'), currentLen = e.target.value.length;
      if(allowed && e.data){
        const regex = new RegExp(allowed,'g'),
          match = Array.from(e.data.matchAll(regex)).map(match => match[0]),
          sanitised = match && match.length > 0 ? match.join('') : '';
        e.preventDefault();
        let maxLen = e.target.getAttribute('maxlength');
        if(maxLen){
          try{ maxLen = parseInt(maxLen) } catch(ex){ maxLen = Infinity; }
        }
        const currentCursorPosition = input.selectionStart,
          newVal = input.value.slice(0, currentCursorPosition) + sanitised + input.value.slice(currentCursorPosition + 1),
          trimmed = newVal.slice(0, maxLen);
        input.value = trimmed;
        input.setSelectionRange(currentCursorPosition + sanitised.length, currentCursorPosition + sanitised.length);
      }
    });
  });

});