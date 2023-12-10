function fill_template(){
    var data = {
        title: "Verification",
        list:[
            "Kubik Ármin", "Györffy Dániel", "Fehér Szabolcs"
        ],
        footer: "Is It Over Now?..."
    }
    var template = Handlebars.compile(document.getElementById('template').innerHTML);
    var filled = template(data)
    document.querySelector("#output").innerHTML = filled;
}