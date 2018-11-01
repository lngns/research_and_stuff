module xmlconstructor;

mixin template mixinXmlConstruct()
{
    import arsd.dom;
    import std.traits;

    auto xmlConstruct(string source, string[string] aliases = null)()
    {
        //We can't have class instances in enums and other static stuff, yet we can have them as part of their init-expressions
        //So I'm parsing the code 36 thousand times just because I can't keep my XmlDocument somewhere
        //sad
        static if(new XmlDocument(source).root.tagName == "d:template")
            mixin("alias typename = " ~ new XmlDocument(source).root.attributes["d:type"] ~ ";");
        else static if(new XmlDocument(source).root.tagName in aliases)
            mixin("alias typename = " ~ aliases[new XmlDocument(source).root.tagName] ~ ";");
        else
            mixin("alias typename = " ~ new XmlDocument(source).root.tagName ~ ";");
        static if(is(typename == class))
            typename obj = new typename;
        else
            typename obj;

        static foreach(attr, value; new XmlDocument(source).root.attributes)
        {
            static if(hasMember!(typename, attr))
            {
                static if(is(typeof(__traits(getMember, obj, attr)) == string))
                {
                    static if(value[0..2] == "d{" && value[$-1] == '}')
                        mixin("obj." ~ attr ~ " = " ~ value[2..$-1] ~ ";");
                    else
                        mixin("obj." ~ attr ~ " = \"" ~ value ~ "\";");
                }
                else
                    mixin("obj." ~ attr ~ " = " ~ value ~ ";");
            }
        }
        static if(hasMember!(typename, "opXml") && isFunction!(typename.opXml) && is(ReturnType!(typeof(&typename.opXml)) == void))
        {
            enum length = new XmlDocument(source).root.childNodes.length;
            static foreach(i; 0..length)
            {
                static if(new XmlDocument(source).root.childNodes[i].tagName[0] != '#')
                {
                    obj.opXml(xmlConstruct!(new XmlDocument(source).root.childNodes[i].toString(), aliases));
                }
            }
        }

        return obj;
    }
}

