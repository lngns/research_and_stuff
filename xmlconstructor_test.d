import xmlconstructor;
import std.stdio;

mixin mixinXmlConstruct;

struct Family
{
private:
    Person[] members;
    Pet[] pets;

public:
    string lastName;

    void opXml(Person p)
    {
        members ~= p;
    }
    void opXml(Pet p)
    {
        pets ~= p;
    }
}
struct Person
{
    string name;
    uint age;
}
struct Pet
{
    enum Type { Cat, Dog, Hamster, Lizard, Pikachu }
    Type type;
    string name;
    uint age;
}
class Box(T)
{
    T value;
}
struct Pair(T, U)
{
    T first;
    U second;
}
struct Map(K, V)
{
private:
    Pair!(K, V)[] pairs;

public:
    void opXml(Pair!(K, V) pair)
    {
        pairs ~= pair;
    }
}
enum ErrorMessage = "An error occurred and the application stopped.";

int main()
{
    auto family = xmlConstruct!`
        <Family lastName="Doe">
            <!-- All children objects are passed to opXml() with the right overload -->
            <!--
                If the field is of string type, it is initialized to the attribute's contents.
                For all other types, the attribute's is interpreted as a D expression and the field
                is initialized to its result.
            -->
            <Person name="Bob" age="24" />
            <Person name="Sam" age="26" />
            <Pet type="Pet.Type.Dog" name="Good Doggo" age="4" />
        </Family>
    `;
    writeln(family);

    family = xmlConstruct!q{
        <!-- It is possible to embed a D expression inside a string field attribute by surrounding it by "d{" and "}" -->
        <Family lastName="Smith">
            <Person name="d{`Oh No! ` ~ ErrorMessage}" age="0" />
        </Family>
    };
    writeln(family);

    auto box = xmlConstruct!q{
        <!-- Template instantiations are valid tag names -->
        <Box!int value="42" />
    };
    writeln(box.value);

    auto pair = xmlConstruct!q{
        <!-- Multiple template arguments are allowed only if no whitespaces are present. -->
        <Pair!(int,string) first="0" second="Hello World!" />
    };
    writeln(pair);

    pair = xmlConstruct!q{
        <!-- The "d:template" pseudo-class can be used with the "d:type" attribute to have a nicer template instance -->
        <d:template d:type="Pair!(int, string)" first="0" second="Hello World!" />
    };
    writeln(pair);

    alias ISPair = Pair!(int, string);
    auto map = xmlConstruct!q{
        <Map!(int,string)>
            <Pair!(int,string) first="0" second="Hello " />
            <Pair!(int,string) first="1" second="World!" />
        </Map!(int,string)>
    };
    writeln(map);
    return 0;
}
