module xmlconstructor;

mixin template mixinXmlConstruct()
{
    import arsd.dom;
    import std.traits;

    auto xmlConstruct(string source)()
    {
        //triggers some error I don't get
        //static const Doc = new XmlDocument(source);
        enum tagName = new XmlDocument(source).root.tagName;
        enum attributes = new XmlDocument(source).root.attributes;
        static if(tagName == "d:template")
            mixin("alias typename = " ~ attributes["d:type"] ~ ";");
        else
            mixin("alias typename = " ~ tagName ~ ";");
        static if(is(typename == class))
            typename obj = new typename;
        else
            typename obj;

        static foreach(attr, value; attributes)
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
                    obj.opXml(xmlConstruct!(new XmlDocument(source).root.childNodes[i].toString()));
                }
            }
        }

        return obj;
    }
}

