class Contact {
  constructor(name, surname, phone, mail, street, code, city) {
    this.name = name;
    this.surname = surname;
    this.phone = phone;
    this.mail = mail;
    this.street = street;
    this.code = code;
    this.city = city;
    this.detailsShown = false;
  }
}


class ContactList {
  constructor() {
    this.all = {};
  }

  add(contact) {
    let indexList = Object.keys(this.all).map(x => Number(x));
    let index = Math.max(...indexList, 0) + 1;
    contact.id = index;
    this.all[index] = contact;
  }

  update(id, newContact) {
    let contact = this.all[id];
    for (let key in contact) {
      if (key !== "id") contact[key] = newContact[key];
    }
  }

  delete(id) {
    delete this.all[id];
  }

  display(searchphrase) {
    $("#no-contacts").hide();
    $("#no-found").hide();
    $("#contacts").empty();

    // get objects to display
    let results = Object.values(this.all);

    // excape unwanted characters
    if (searchphrase) searchphrase = searchphrase
      .replace(/[.*+?^${}()|[\]\\]/g, x => `\\${x}`);

    // filter contacts acc. to the searchphrase
    let additionalValues = obj => [`${obj.name} ${obj.surname}`, `${obj.surname} ${obj.name}`];
    let fieldsToCheck = obj => {
      let arr = Object
        .keys(obj)
        .filter(x => x !== "id")
        .map(x => obj[x]);
      arr.push(...additionalValues(obj));
      return arr;
    };
    let regPhrase = new RegExp(".*" + searchphrase + ".*", "gi");
    if (searchphrase) results = results
      .filter(contact => fieldsToCheck(contact).some(val => regPhrase.test(val)));

    // display messages or contacts
    if (!results.length && searchphrase) {
      $("#no-found").show();
    } else if (!results.length && !searchphrase) {
      $("#no-contacts").show();
    } else {
      results
        .sort((a, b) => a.surname === b.surname
          ? a.name.localeCompare(b.name)
          : (a.surname || a.name).localeCompare(b.surname || b.name))
        .forEach(obj => {
          let boldRegExp = str => (str || "")
            .replace(new RegExp((searchphrase || (obj.surname || obj.name))
              .split(" ")
              .join("|"), "gi"), x => `<b>${x}</b>`);
          let hiddenValues = [obj.name, obj.surname, ...additionalValues(obj)]
          let searchCondition = searchphrase ? fieldsToCheck(obj)
            .filter(val => regPhrase.test(val) && !hiddenValues.includes(val))
            .map(x => boldRegExp(x))
            .join(", ") : "";
          $("<p>")
            .html(`${boldRegExp(obj.name)} ${boldRegExp(obj.surname)} 
                            <span class="search-condition">${searchCondition}</span>`)
            .attr("id", "contact-id-" + obj.id)
            .addClass("contact")
            .appendTo("#contacts");
        });
    }
  }
}


$(function () {

  let contacts = new ContactList();

  // add sample contacts
  contacts.add(new Contact("Mark", "Examplesson", "0176 0000 0000", "example1@ex.com", "Musterstrasse 5", "00000", "Markland"));
  contacts.add(new Contact("Steve", "Examplesson", "0177 1111 1111", "example2@ex.com", "Example St 16", "00000", "Stevelande"));
  contacts.add(new Contact("Max", "Musterman", "0176 2222 0000", "example3@ex.com", "", "", ""));
  contacts.add(new Contact("Mark", "", "0151 2222 0000", "mark@ex.com", "", "", ""));
  contacts.add(new Contact("Steve", "", "0161 1111 0000", "steve@ex.com", "", "", "Steveland"));
  contacts.display();


  // adding a contact - show form
  $("#add-link").on("click", () => {
    $("#add-section").slideDown(100);
    $("#added").hide();
  });


  // adding/ editing a contact - submit form
  $("#add-form").on("submit", event => {
    event.preventDefault();

    // get form data
    let name = $("#name").val().replace(/\b\w/g, x => x.toUpperCase());
    let surname = $("#surname").val().replace(/\b\w/g, x => x.toUpperCase());
    let phone = $("#phone").val();
    let mail = $("#mail").val();
    let street = $("#street").val();
    let code = $("#code").val();
    let city = $("#city").val();

    // add contact to all contacts or update contact if editing
    let editId = $("#edit").val();
    let contact = new Contact(name, surname, phone, mail, street, code, city);
    if (editId) {
      contacts.update(editId, contact);
    } else {
      contacts.add(contact);
    }

    // clear and hide form
    $("#add-form")[0].reset();
    $("#edit").val("");
    $("#add-section").hide();

    // display contacts
    contacts.display();

    // display success message 
    $("#added").show();
    setTimeout(() => $("#added").hide(), 5000);
  });


  // display details of a contact
  $("#contacts").on("click", ".contact", event => {
    if (/^delete/.test(event.target.id)) return;

    let target = event.target.id ? event.target : $(event.target).closest("p");
    let id = (event.target.id || $(event.target).closest("p").attr("id"))
      .replace(new RegExp("^.*-id-"), "");
    let obj = contacts.all[id];

    if (obj.detailsShown) {
      $("#info-id-" + id).remove();
      $("#delete-id-" + id).remove();
      $("#edit-id-" + id).remove();
      obj.detailsShown = false;
    } else {
      let phone = obj.phone || "-";
      let mail = obj.mail || "-";
      let address = ([obj.street, obj.code, obj.city]
        .filter(x => x.trim().length)
        .join(", ")) || "-";
      let addInfo = $("<p>")
        .html(`Phone number: ${phone}<br> 
                    E-mail address: ${mail}<br> 
                    Street address: ${address}`)
        .attr("id", "info-id-" + id)
        .addClass("add-info");
      $(addInfo).insertAfter(target);

      $("<span>")
        .text("Delete")
        .attr("id", "delete-id-" + id)
        .addClass("link delete")
        .appendTo(target);

      $("<span>")
        .text("Edit")
        .attr("id", "edit-id-" + id)
        .addClass("link edit")
        .appendTo(target);

      $(".add-info").slideDown(100);

      obj.detailsShown = true;
    }
  });


  // delete contact
  $("#contacts").on("click", ".delete", event => {
    $("#added").hide();
    let id = event.target.id.replace("delete-id-", "");
    contacts.delete(id);
    contacts.display();
  });


  // edit contact
  $("#contacts").on("click", ".edit", event => {
    // fill add form with existing data
    let id = event.target.id.replace("edit-id-", "");
    let obj = contacts.all[id];
    $("#edit").val(id);
    $("#name").val(obj.name);
    $("#surname").val(obj.surname);
    $("#phone").val(obj.phone);
    $("#mail").val(obj.mail);
    $("#street").val(obj.street);
    $("#code").val(obj.code);
    $("#city").val(obj.city);

    $("#add-section").slideDown(100);
    $("#added").hide();

    $(this).scrollTop(0);
  });


  // searching contacts
  $("#search-bar").on("keyup", () => {
    let searchphrase = $("#search-bar").val();
    contacts.display(searchphrase);
  });


  $("#search-form").on("submit", event => {
    event.preventDefault();
  });
});